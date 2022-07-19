class BaseOffchainWorkflow {

    constructor(appEventsMap) {
        this.appEventsMap = appEventsMap;
    }

    getAppEventsMap() {
        return this.appEventsMap;
    }
}


class MintNFTWorkflow extends BaseOffchainWorkflow {

    constructor(appCmds) {

        // We may also need to validate commands here instead of "validate()" method to ensure that the workflow is being triggered by appropriate commands

        super({

            [CHAIN_EVENTS.NFT_ITEM_CREATED]: (chainEvent) => {
                const appCmd = appCmds.find(cmd => cmd.type == APP_CMD.CREATE_NFT_ITEM && cmd.nftId == chainEvent.nftId);
                return new NFTItemCreatedAppEvent({
                    nftId: chainEvent.nftId,
                    attributes: appCmd.attributes,
                    ...
                });
            },

            [CHAIN_EVENTS.NFT_ITEM_METADATA_SET]: (chainEvent) => {
                const appCmd = appCmds.find(cmd => cmd.type == APP_CMD.NFT_ITEM_METADATA_SET && cmd.nftId == chainEvent.nftId);
                return new NFTItemMetadataSetAppEvent({
                    nftId: chainEvent.nftId,
                    metadataHash: chainEvent.metadata,
                    metadata: appCmd.metadata,
                    ...
                });
            }
        })
    }
}

class AssetsController extends BaseController {

    createNFTItem = this.command({
        h: async (ctx) => {
            try {
                const { tx, appCmds } = msg;
                const workflow = new MintNFTWorkflow(appCmds);
                super.sendChainTxAndProcessWorkflow(tx, workflow)
                ctx.successRes();
            } catch (err) {
                ctx.errorRes(err);
            }
        }
    }
}


class BaseController {

    sendChainTxAndProcessWorkflow(tx, workflow) {

        const chainService = await ChainService.getInstanceAsync(config);
        const chainRpc = chainService.getChainRpc();
        const chainNodeClient = chainService.getChainNodeClient();
        const eventStore = await EventStore.getInstanceAsync(config);
        const eventBus = await EventBus.getInstanceAsync(config);
        const offchainProcessManager = OffchainProcessManager.getInstanceAsync();

        const verifiedTxPromise = tx.isOnBehalfPortal()
            ? tx.verifyByPortalAsync({ verificationPubKey: config.TENANT_PORTAL.pubKey, verificationPrivKey: config.TENANT_PORTAL.privKey }, chainNodeClient)
            : Promise.resolve(tx.getSignedRawTx());
        const verifiedTx = await verifiedTxPromise;

        const lastBlockNumber = await chainNodeClient.getBlock();
        const txHash = await chainRpc.sendTxAsync(verifiedTx);

        // This needs to be validated for concurrent updates of the same entity
        const appEvents = await offchainProcessManager.waitOffchainWorkflow(
            offchainProcessManager.queueOffchainWorkflow(txHash, lastBlockNumber, workflow)
        );

        await eventStore.saveBatch(appEvents);
        eventBus.dispatch(appEvents);
    }

}


class OffchainProcessManager extends Singleton {

    tasks = [];

    // Must use First In First Out (FIFO) approach. For that reason, we use an intermediate 'tasks' array. 
    // This is important as we must process chain events in the same order they occurred in the chain.
    // Asynchronous calls such as '_fetchChainEvents' may violate the original order of chain events.
    queueOffchainWorkflow(txHash, startBlock, workflow) {
        const taskId = `${txHash}-${Date.now().getTime()}`;
        this.tasks.push({
            taskId,
            status: 'pending',
            txHash,
            startBlock,
            workflow
            appEvents: []
        });

        this._processTask(taskId);

        return taskId;
    },

    
    asyns waitOffchainWorkflow(taskId) {
        const idx = this.tasks.findIndex(t => t.taskId == taskId && status == 'completed');

        if (idx === 0) { // Must be FIFO
            const task = this.tasks.shift();
            return task.appEvents;
        } else {
            // todo: add delayed recursion call of this function.
        }
    }




    async _processTask(taskId) {
        const task = this.tasks.find(t => t.taskId == taskId);
        const { txHash, startBlock, workflow } = task;

        const chainEvents = await this._fetchChainEvents(txHash, startBlock);
        task.appEvents.push(this._mergeChainEventsToAppEvents(chainEvents, workflow.getAppEventsMap()));
        task.status = 'completed';
    }



    async _fetchChainEvents(txHash, startBlock) {
        const chainService = await ChainService.getInstanceAsync(config);
        const redisStorage = await RedisStorage.getInstanceAsync();
        const chainNodeClient = chainService.getChainNodeClient();

        let batchExtrinsicIndexIsNotFound = true;

        let batchExtrinsicIndex = null;
        let batchBlockNumber = null;

        const TIMES_LIMIT = 10;
        let times = 0;

        while (batchExtrinsicIndexIsNotFound && times <= TIMES_LIMIT) {
            times += 1;

            const block = await chainNodeClient.getBlock(startBlock);

            block.extrinsics.forEach((ex, index) => {
                if (ex.hash.toHex() === txHash) {
                    batchExtrinsicIndexIsNotFound = false;
                    batchExtrinsicIndex = index;
                    batchBlockNumber = block.number;
                    return;
                }
            });

            await waitNextBlock();
            startBlock += 1;
        }

        if (batchExtrinsicIndexIsNotFound) {
            throw new Error("Transaction was not included to the chain");
        }

        // todo: add additional logic for recurring attempts and for a case when there are no any events for the processed transaction
        const chainEvents = await redisStorage.getEventsBatch(batchExtrinsicIndex, batchBlockNumber);
        return chainEvents;
    }


    _mergeChainEventsToAppEvents(chainEvents, appEventsMap) {
        const appEvents = [];
        for (let i = 0; i < chainEvents.length; i++) {
            const chainEvent = chainEvents[i];
            const mergeFn = appEventsMap[chainEvent.type];

            if (mergeFn) {
                appEvents.push(mergeFn(chainEvent));
            } else {
                console.log(`Warning, chain event ${chainEvent} is not handled in MintNFTSaga`);
                // We should never skip any events from the domain chain. In case we don't have a handler for a chain event we need to persist it in the EventStore and be able to process it later via the "Replay"
                appEvents.push(new AppEvent({ type: APP_EVENTS.UNKNOWN, data: { ...chainEvent } }));
            }
        }
    }

}
