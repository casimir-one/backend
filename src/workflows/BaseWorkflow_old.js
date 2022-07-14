import { APP_CMD, DOMAIN_EVENT } from "@casimir/platform-core/lib";

class BaseOnChainWorkflow {

    _ctx = {};

    constructor(workflowNum, ctx, rootCmd) {
        // this.appEventsMap = appEventsMap;
        this._rootCmd = rootCmd;
        this._workflowNum = workflowNum;
        this._ctx.issuer = ctx.state.user?.username;
    }

    getAppEventsMap() {
        return this.appEventsMap;
    }

    getRootCmd() {
        return this._rootCmd;
    }

    getWorkflowNum() {
        return this._workflowNum;
    }

    getState() {
        return this._ctx;
    }
}


class BaseWorkflow {
    constructor() {

    }
}

class OnChainWorkflow extends BaseOnChainWorkflow {
    constructor() {

    }

    setExtrinsicHash(extrinsicHash) {
        this._extrinsicHash = extrinsicHash;
    }
}

class OffChainWWorkflow {
    constructor() {

    }
}

//workflow is a class that config behavior between cmd, event and chainEvent
//workflow = 1 cmd + N chainEvents -> 1 AppEvent
//receive cmds -> create workflow -> processWorkflow (send tx, wait for events) -> send events to app

const APP_WORKFLOW = {
    CREATE_NFT_COLLECTION: 1,
}


export class CreateNFTCollectionWorkflow extends BaseOffchainWorkflow {

    parentCmd = APP_CMD.CREATE_NFT_COLLECTION;
    requiredChainEvents = [
        DOMAIN_EVENT.NFT_COLLECTION_CREATED,
        DOMAIN_EVENT.NFT_COLLECTION_METADATA_SET,
        DOMAIN_EVENT.NFT_TEAM_CHANGED
    ];

    constructor(ctx, appCmds) {
        // We may also need to validate commands here instead of "validate()" method to ensure that the workflow is being triggered by appropriate commands
        const createNFTCollectionCmd = appCmds.find(cmd => cmd.type == APP_CMD.CREATE_NFT_COLLECTION);

        super(APP_WORKFLOW.CREATE_NFT_COLLECTION, ctx, {
            rootCmd: createNFTCollectionCmd,
        });
    }

    fullFillChainEvents(chainEvents) {
        const checkChainEvents = this.requiredChainEvents.length === chainEvents;
        if(checkChainEvents) {
            this.setChainEvents(chainEvents)
        }
        return checkChainEvents;
    }

    validate() {

        const validateCreateNFTCollectionCmd = async (ctx, createNFTCollectionCmd, cmdStack) => {
            const { issuedByTeam, issuer } = createNFTCollectionCmd.getCmdPayload();
            const username = ctx.state.user.username;

            if (issuedByTeam) {
                const isAuthorized = await teamDtoService.authorizeTeamAccount(issuer, username)
                if (!isAuthorized) {
                    throw new ForbiddenError(`"${username}" is not permitted to create nft collection`);
                }
            } else if (issuer !== username) {
                throw new BadRequestError(`Can't create nft collection for other accounts`);
            }
        };

        const createNFTCollectionSettings = {
            cmdNum: APP_CMD.CREATE_NFT_COLLECTION,
            validate: validateCreateNFTCollectionCmd
        };

        const validCmdsOrder = [createNFTCollectionSettings];

        return BaseController.validCmdsOrder()
    }

    isFullfilled() {
        const events = this.getChainEvents();
        //check if event numbers equals to requiredChainEvents

    }


    produceAppEvents() {
        const cmds = this.getCmds();
        const chainEvents = this.getChainEvents();

        return ({
            [CHAIN_EVENTS.NFT_ITEM_CREATED]: (chainEvent) => {
                const appCmd = appCmds.find(cmd => cmd.type == APP_CMD.CREATE_NFT_ITEM && cmd.nftId == chainEvent.nftId);
                return new NFTItemCreatedAppEvent({
                    nftId: chainEvent.nftId,
                    attributes: appCmd.attributes,
                })
            },

            [CHAIN_EVENTS.NFT_ITEM_METADATA_SET]: (chainEvent) => {
                const appCmd = appCmds.find(cmd => cmd.type == APP_CMD.NFT_ITEM_METADATA_SET && cmd.nftId == chainEvent.nftId);
                return new NFTItemMetadataSetAppEvent({
                    nftId: chainEvent.nftId,
                    metadataHash: chainEvent.metadata,
                    metadata: appCmd.metadata,
                });
            }
        })

    }
}
//CreateNftItemCmd
class MintNFTWorkflow extends BaseOffchainWorkflow {


    constructor(appCmds, txHash) {
        const [] = []
        // We may also need to validate commands here instead of "validate()" method to ensure that the workflow is being triggered by appropriate commands

        super({


        })

    }


    produceAppEvents() {
        const cmds = this.getCmds();
        const chainEvents = this.getChainEvents();

        return ({
            [CHAIN_EVENTS.NFT_ITEM_CREATED]: (chainEvent) => {
                const appCmd = appCmds.find(cmd => cmd.type == APP_CMD.CREATE_NFT_ITEM && cmd.nftId == chainEvent.nftId);
                return new NFTItemCreatedAppEvent({
                    nftId: chainEvent.nftId,
                    attributes: appCmd.attributes,
                })
            },

            [CHAIN_EVENTS.NFT_ITEM_METADATA_SET]: (chainEvent) => {
                const appCmd = appCmds.find(cmd => cmd.type == APP_CMD.NFT_ITEM_METADATA_SET && cmd.nftId == chainEvent.nftId);
                return new NFTItemMetadataSetAppEvent({
                    nftId: chainEvent.nftId,
                    metadataHash: chainEvent.metadata,
                    metadata: appCmd.metadata,
                });
            }
        })

    }
}
