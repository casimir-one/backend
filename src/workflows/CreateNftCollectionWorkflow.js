import { APP_CMD, DOMAIN_EVENT } from '@casimir/platform-core';
import { logWarn, logDebug } from './../utils/log';
import { APP_CMD_TO_BC_EVENT_PROCESSOR } from '../process-manager/AppCmdToBlockchainEvent'
import { NFTCollectionMetadataCreatedEvent } from '../events';

class BaseOffchainWorkflow {

    constructor(appCmds, appEventsMap) {
        this.appEventsMap = appEventsMap;
        this.appCmds = appCmds;

        this.cmdsRelatedChainEventMatchers = appCmds
            .map(appCmd => appCmd.getCmdNum())
            .map(cmdNum => ({ cmdNum, matchers: APP_CMD_TO_BC_EVENT_PROCESSOR[cmdNum] }))
            .filter(({ matchers }) => matchers && matchers.length > 0);
    }

    getAppEventsMap() {
        return this.appEventsMap;
    }

    getRequiredChainEvents() {
        return this.requiredChainEvents;
    }

    async matchChainEvent(chainEvent, chainService) { // { matchResult, cmdNum, eventNum }
        for (const cmdMatcher of this.cmdsRelatedChainEventMatchers) {
            const { matchers, cmdNum } = cmdMatcher;
            for (const matcher of matchers) {
                const { eventNum, matchF } = matcher;
                if (eventNum !== chainEvent.getEventNum()) continue;
                const isMatched = await matchF({
                    appCmd: this.appCmds.find(appCmd => appCmd.getCmdNum() === cmdNum),
                    event: chainEvent,
                    chainService
                });
                return isMatched;
            }
        }
    }
}

export class CreateNFTCollectionWorkflow extends BaseOffchainWorkflow {
    constructor(appCmds) {
        //validate cmds

        // We may also need to validate commands here instead of "validate()" method to ensure that the workflow is being triggered by appropriate commands
        super(appCmds, {
            [DOMAIN_EVENT.NFT_COLLECTION_CREATED]: (chainEvent) => {
                logDebug("CreateNFTCollectionWorkflow - NFT_COLLECTION_CREATED", { appCmds, chainEvent });
                const cmd = appCmds.find(appCmd => appCmd.getCmdNum() === APP_CMD.CREATE_NFT_COLLECTION);
                const { entityId, issuer, attributes, issuedByTeam } = cmd.getCmdPayload();

                return new NFTCollectionMetadataCreatedEvent({ entityId, issuer, attributes, issuedByTeam })
            },
            [DOMAIN_EVENT.NFT_TEAM_CHANGED]: (chainEvent) => {
                logDebug("CreateNFTCollectionWorkflow - NFT_TEAM_CHANGED", { appCmds, chainEvent });
                //skip
                return;
                // return new NFTCollectionCreatedAppEvent(data);
            },
        })
    }
}
