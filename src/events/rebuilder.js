import {
    AcceptProposalCmd,
    CreateNftItemCmd,
    CreateProposalCmd,
    DeclineProposalCmd,
    TransferFTCmd,
    TransferNFTCmd
} from '@casimir/commands';
import { APP_CMD, APP_EVENT } from '@casimir/platform-core';
import { logWarn } from '../utils/log';
import BaseEvent from './base/BaseEvent';
import {
    FTTransferredEvent,
    NFTItemMetadataDraftCreatedEvent,
    NFTLazyBuyProposalAcceptedEvent,
    NFTLazyBuyProposalCreatedEvent,
    NFTLazyBuyProposalDeclinedEvent,
    NFTLazySellProposalAcceptedEvent,
    NFTLazySellProposalCreatedEvent,
    NFTLazySellProposalDeclinedEvent,
    NFTTransferredEvent,
    ProposalAcceptedEvent,
    ProposalCreatedEvent,
    ProposalDeclinedEvent,
    NFTItemCreatedEvent,
    NFTItemMetadataDraftStatusUpdatedEvent,
    NFTItemMetadataDraftModerationMsgUpdatedEvent,
    DaoCreatedEvent,
    NFTCollectionMetadataCreatedEvent,
    NFTCollectionCreatedEvent,
    DAOImportedEvent
} from './index.js';


const buildEventProposalCmd = (eventPayload) => ({
    ...eventPayload,
    proposalCmd: rebuildCmd(eventPayload.proposalCmd)
});

const buildCmdProposedCmds = (cmdPayload) => {
    return ({
        ...cmdPayload,
        proposedCmds: cmdPayload.proposedCmds.map(rebuildCmd)
    });
}

const buildEvent = (ProxyClass, updatePayloadF) => (payload) => {
    const _payload = updatePayloadF ? updatePayloadF(payload) : payload;
    
    return new ProxyClass(_payload);
}
const buildCmd = buildEvent;


const cmdParser = {
    [APP_CMD.CREATE_PROPOSAL]: buildCmd(CreateProposalCmd, buildCmdProposedCmds),
    [APP_CMD.ACCEPT_PROPOSAL]: buildCmd(AcceptProposalCmd),
    [APP_CMD.DECLINE_PROPOSAL]: buildCmd(DeclineProposalCmd),

    [APP_CMD.TRANSFER_FT]: buildCmd(TransferFTCmd),
    [APP_CMD.TRANSFER_NFT]: buildCmd(TransferNFTCmd),
    [APP_CMD.CREATE_NFT_ITEM]: buildCmd(CreateNftItemCmd),
}


const eventParser = {
    [APP_EVENT.DAO_CREATED]: buildEvent(DaoCreatedEvent),
    [APP_EVENT.DAO_IMPORTED]: buildEvent(DAOImportedEvent),

    [APP_EVENT.FT_TRANSFERRED]: buildEvent(FTTransferredEvent),
    [APP_EVENT.NFT_TRANSFERRED]: buildEvent(NFTTransferredEvent),

    [APP_EVENT.NFT_ITEM_CREATED]: buildEvent(NFTItemCreatedEvent),
    [APP_EVENT.NFT_ITEM_METADATA_DRAFT_CREATED]: buildEvent(NFTItemMetadataDraftCreatedEvent),
    [APP_EVENT.NFT_ITEM_METADATA_DRAFT_STATUS_UPDATED]: buildEvent(NFTItemMetadataDraftStatusUpdatedEvent),
    [APP_EVENT.NFT_ITEM_METADATA_DRAFT_MODERATION_MSG_UPDATED]: buildEvent(NFTItemMetadataDraftModerationMsgUpdatedEvent),

    [APP_EVENT.NFT_COLLECTION_CREATED]: buildEvent(NFTCollectionCreatedEvent),
    [APP_EVENT.NFT_COLLECTION_METADATA_CREATED]: buildEvent(NFTCollectionMetadataCreatedEvent),

    [APP_EVENT.PROPOSAL_CREATED]: buildEvent(ProposalCreatedEvent, buildEventProposalCmd),
    [APP_EVENT.PROPOSAL_ACCEPTED]: buildEvent(ProposalAcceptedEvent),
    [APP_EVENT.PROPOSAL_DECLINED]: buildEvent(ProposalDeclinedEvent),

    [APP_EVENT.NFT_LAZY_SELL_PROPOSAL_CREATED]: buildEvent(NFTLazySellProposalCreatedEvent, buildEventProposalCmd),
    [APP_EVENT.NFT_LAZY_SELL_PROPOSAL_ACCEPTED]: buildEvent(NFTLazySellProposalAcceptedEvent, buildEventProposalCmd),
    [APP_EVENT.NFT_LAZY_SELL_PROPOSAL_DECLINED]: buildEvent(NFTLazySellProposalDeclinedEvent, buildEventProposalCmd),

    [APP_EVENT.NFT_LAZY_BUY_PROPOSAL_CREATED]: buildEvent(NFTLazyBuyProposalCreatedEvent, buildEventProposalCmd),
    [APP_EVENT.NFT_LAZY_BUY_PROPOSAL_ACCEPTED]: buildEvent(NFTLazyBuyProposalAcceptedEvent, buildEventProposalCmd),
    [APP_EVENT.NFT_LAZY_BUY_PROPOSAL_DECLINED]: buildEvent(NFTLazyBuyProposalDeclinedEvent),
}

const rebuildCmd = rawCmd => {
    const { _cmdNum, _cmdPayload } = rawCmd;

    const rebuildF = cmdParser[_cmdNum];
    if (!rebuildF)
        logWarn(`WARNING: Cmd rebuilder don't support cmd ${APP_CMD[_cmdNum]}:${_cmdNum}`);

    return rebuildF ? rebuildF(_cmdPayload) : _cmdPayload;
};

//Process application rawEvent from external queue service (kafka) into rich AppEvent
const rebuildEvent = rawEvent => {
    const { eventNum, eventPayload, eventIssuer } = rawEvent;

    const parseF = eventParser[eventNum];
    if (eventNum && !parseF)
        logWarn(`WARNING: Event rebuilder don't support event ${APP_EVENT[eventNum]}:${eventNum}`);

    const event = eventNum && parseF ? parseF(eventPayload, eventIssuer)
        : eventNum && new BaseEvent(eventNum, eventPayload, eventIssuer);

    if (event && eventIssuer) event.setEventIssuer(eventIssuer);

    return event;
}

module.exports = {
    rebuildEvent,
    rebuildCmd
}