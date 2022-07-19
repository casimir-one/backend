import { DOMAIN_EVENT } from '@casimir/platform-core';
import { ChainService } from '@deip/chain-service';
import { Singleton } from "@deip/toolbox";
import { logDebug, logError, logWarn } from '../utils/log';
import { redis } from './redis';
import EventEmitter from 'events';

const TASK_STATUS = {
    PENDING: 'pending',
    COMPLETED: 'completed',
    FAILED: 'failed'
}
const blockNumberToEvents = redis; //[blockNumber]: [event]


export class OffchainProcessManager extends Singleton {

    constructor() {
        super();
    }

    static getInstanceAsync(config) {
        const insatnce = OffchainProcessManager.getInstance(config);
        return insatnce.init(config);
    }

    async init(config) {
        if (this.initialized) return this;
        this.tasks = []; //TODO: move to separate TaskManager entiry that will persist tasks into redis or something like that
        this.eventEmmiter = new EventEmitter();
        this.chainService = await ChainService.getInstanceAsync(config);
        this.initialized = true;
        return this;
    }

    async processNewBlockEvent(blockEvent) {
        const { number, hash, meta } = blockEvent.getEventPayload();

        if (!meta.domain_events) return;

        const chainRpc = this.chainService.getChainRpc();
        const chainNodeClient = this.chainService.getChainNodeClient();

        const block = await chainRpc.getBlockByHashAsync(hash);
        const connectedTasks = this.tasks.filter(t => block.extrinsicHashes.includes(t.txHash));

        if (!connectedTasks.length) return;

        const apiAt = await chainNodeClient.at(hash);
        const blockExtrinsicEvents = await apiAt.query.system.events();

        for (const task of connectedTasks) {
            const extrinsicIndex = block.extrinsicHashes.indexOf(task.txHash);
            const extrinsicEventErrors = blockExtrinsicEvents.map(({ phase, event: extrinsicEvent }) => {

                const extrinsicFailed = phase.isApplyExtrinsic &&
                    phase.asApplyExtrinsic.eq(extrinsicIndex) &&
                    chainNodeClient.events.system.ExtrinsicFailed.is(extrinsicEvent)

                if (extrinsicFailed) {
                    const { data: [error, info] } = extrinsicEvent;
                    let errorString;

                    if (error.isModule) {
                        const decoded = chainNodeClient.registry.findMetaError(error.asModule);
                        const { docs, method, section } = decoded;
                        errorString = `${section}.${method}: ${docs.join(' ')}`;
                    } else {
                        errorString = error.toString();
                    }
                    return errorString
                }
            }).filter(Boolean);

            task.status = extrinsicEventErrors.length ? TASK_STATUS.FAILED : TASK_STATUS.COMPLETED;
            task.error = extrinsicEventErrors.length ? extrinsicEventErrors.join('\n') : null;
            task.extrinsicIndex = extrinsicIndex;
            task.execuredInBlock = block;
            logDebug("Task finished in bLock", task);
        }
        await this.processBlockEvents(block);
    }

    async processBlockEvents(block) {
        const blockEvents = blockNumberToEvents.get(block.number);
        if (!blockEvents) return;

        const eventBatchesByExtrinsicIndex = blockEvents.reduce((acc, event) => { // [extrinsicIndex]: [event]
            const { meta: { index } } = event.getEventPayload();
            if (!acc[index]) acc[index] = [];
            acc[index].push(event);
            return acc;
        }, {});

        //we must keep order of extrinsic in the block
        const extrinsicIndexesSorted = Object.keys(eventBatchesByExtrinsicIndex).sort((a, b) => a - b);

        for (const extrinsicIndex of extrinsicIndexesSorted) {
            const extrinsicEvents = eventBatchesByExtrinsicIndex[extrinsicIndex];
            const extrinsicHash = block.extrinsicHashes[extrinsicIndex];
            //additional check for blockNumber here because we may have extrinsic duplicated in a few blocks
            const task = this.tasks.find(t => t.txHash === extrinsicHash && t.execuredInBlock.number === block.number);
            const appEvents = await this.buildAppEvents(task, extrinsicEvents);
            if (task) {
                task.appEvents = appEvents.filter(Boolean);
                //dispatch appEvents here!
                this.eventEmmiter.emit(this.buildTaskId(task), task);
            }
        }

    }

    async buildAppEvents(task, chainEvents) {
        const appEventsMap = task?.workflow?.getAppEventsMap() || {};
        const appEvents = [];
        for (const chainEvent of chainEvents) {
            const isMatched = await task?.workflow?.matchChainEvent(chainEvent, this.chainService);
            if (isMatched) {
                const buildEventF = appEventsMap[chainEvent.getEventNum()];
                appEvents.push(buildEventF(chainEvent));
            } else {
                appEvents.push(new BaseEvent({ type: "UNKNOWN", data: { chainEvent } }));
            }
        }
        return appEvents;
    }


    //namings...
    async processDomainEvent(event) {
        const { meta: { index, block } } = event.getEventPayload();
        blockNumberToEvents.setArray(block.number, [event]);
    }

    //namings...
    async processChainEvent(event) {
        const processor = event.getEventNum() === DOMAIN_EVENT.BLOCK_CREATED ?
            this.processNewBlockEvent :
            this.processDomainEvent;

        return processor.bind(this)(event);
    }

    // Must use First In First Out (FIFO) approach. For that reason, we use an intermediate 'this.tasks' array. 
    // This is important as we must process chain events in the same order they occurred in the chain.
    // Asynchronous calls such as '_fetchChainEvents' may violate the original order of chain events.
    buildTaskId = ({ txHash, startBlock }) => `${txHash}-${startBlock.number}`;

    queueOffchainWorkflow(txHash, startBlock, workflow) {
        const taskId = this.buildTaskId({ txHash, startBlock });
        this.tasks.push({
            taskId,
            status: TASK_STATUS.PENDING,
            txHash,
            startBlock,
            workflow,
            appEvents: []
        });
        logDebug(`OffchainProcessManager.queueOffchainWorkflow, Task ${taskId} is queued`, this.tasks.find(t => t.taskId == taskId));
        return taskId;
    }


    async waitOffchainWorkflow(taskId) {
        const eventEmmiter = this.eventEmmiter;
        return new Promise(function (resolve, reject) {
            eventEmmiter.on(taskId, (task) => {
                if (task.error) reject(task.error);
                else resolve(task);
            })
        });
    }

}

