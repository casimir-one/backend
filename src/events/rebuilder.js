import {
    AcceptProposalCmd,
    CreateProposalCmd,
    DeclineProposalCmd,
    TransferFTCmd,
    TransferNFTCmd
} from '@casimir.one/commands';
import { APP_CMD, APP_EVENT } from '@casimir.one/platform-core';
import { logWarn } from '../utils/log';
import BaseEvent from './base/BaseEvent';
import {
    FTTransferredEvent,
    NFTTransferredEvent,
    ProposalAcceptedEvent,
    ProposalCreatedEvent,
    ProposalDeclinedEvent,
    DaoCreatedEvent,
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
}


const eventParser = {
    [APP_EVENT.DAO_CREATED]: buildEvent(DaoCreatedEvent),
    [APP_EVENT.DAO_IMPORTED]: buildEvent(DAOImportedEvent),

    [APP_EVENT.FT_TRANSFERRED]: buildEvent(FTTransferredEvent),
    [APP_EVENT.NFT_TRANSFERRED]: buildEvent(NFTTransferredEvent),

    [APP_EVENT.PROPOSAL_CREATED]: buildEvent(ProposalCreatedEvent, buildEventProposalCmd),
    [APP_EVENT.PROPOSAL_ACCEPTED]: buildEvent(ProposalAcceptedEvent),
    [APP_EVENT.PROPOSAL_DECLINED]: buildEvent(ProposalDeclinedEvent)
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