import { APP_CMD, APP_PROPOSAL, PROPOSAL_STATUS } from '@deip/constants';
import { logWarn } from './../../utils/log';
import APP_PROPOSAL_EVENT from './../../events/base/AppProposalEvent';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { ProposalCreatedEvent, ProposalAcceptedEvent, ProposalDeclinedEvent } from './../../events';


class ProposalCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const proposalCmdHandler = new ProposalCmdHandler();


proposalCmdHandler.register(APP_CMD.CREATE_PROPOSAL, (cmd, ctx) => {
  const { entityId: proposalId, 
    creator, 
    type 
  } = cmd.getCmdPayload();

  const { status } = ctx.state.updatedProposals[proposalId];

  ctx.state.appEvents.push(new ProposalCreatedEvent({
    proposalId: proposalId,
    status: status,
    type: type,
    proposalCmd: cmd,
    creator: creator,
    proposalCtx: ctx.state.proposalsStackFrame
  }));

  
  const ProposalCreatedHookEvent = APP_PROPOSAL_EVENT[type]['CREATED'];
  if (ProposalCreatedHookEvent) {
    ctx.state.appEvents.push(new ProposalCreatedHookEvent({
      proposalCmd: cmd,
      proposalCtx: ctx.state.proposalsStackFrame
    }));
  } else {
    logWarn(`WARNING: No proposal hook event found for ${APP_PROPOSAL[type]} workflow at 'CREATED' stage`);
  }
  
});


proposalCmdHandler.register(APP_CMD.ACCEPT_PROPOSAL, (cmd, ctx) => {
  const { entityId: proposalId, account } = cmd.getCmdPayload();

  const {
    type,
    status,
    proposalCmd,
    proposedCmds
  } = ctx.state.updatedProposals[proposalId];

  const proposalCtx = { proposalId, type, proposedCmds };

  ctx.state.appEvents.push(new ProposalAcceptedEvent({
    proposalId: proposalId,
    status: status,
    proposalCtx: proposalCtx,
    account: account
  }));

  if (status == PROPOSAL_STATUS.APPROVED) {
    
    ctx.state.proposalsStack.push(proposalCtx);
    ctx.state.proposalsStackFrame = ctx.state.proposalsStack[ctx.state.proposalsStack.length - 1];
    
    ProposalCmdHandler.Dispatch(proposedCmds, ctx);

    const ProposalAcceptedHookEvent = APP_PROPOSAL_EVENT[type]['ACCEPTED'];
    if (ProposalAcceptedHookEvent) {
      ctx.state.appEvents.push(new ProposalAcceptedHookEvent({
        proposalCmd: proposalCmd,
        proposalCtx: ctx.state.proposalsStackFrame
      }));
    } else {
      logWarn(`WARNING: No proposal hook event found for ${APP_PROPOSAL[type]} workflow at 'ACCEPTED' stage`);
    }
    
    ctx.state.proposalsStack.pop();
    ctx.state.proposalsStackFrame = ctx.state.proposalsStack[ctx.state.proposalsStack.length - 1] || null;
  }

});


proposalCmdHandler.register(APP_CMD.DECLINE_PROPOSAL, (cmd, ctx) => {
  const { entityId: proposalId, account } = cmd.getCmdPayload();

  const {
    type,
    status,
    proposalCmd,
    proposedCmds
  } = ctx.state.updatedProposals[proposalId];

  const proposalCtx = { proposalId, type, proposedCmds };

  ctx.state.appEvents.push(new ProposalDeclinedEvent({
    proposalId: proposalId,
    status: status,
    proposalCtx: proposalCtx,
    account: account
  }));

  if (status == PROPOSAL_STATUS.REJECTED) {

    ctx.state.proposalsStack.push(proposalCtx);
    ctx.state.proposalsStackFrame = ctx.state.proposalsStack[ctx.state.proposalsStack.length - 1];

    const ProposalDeclinedHookEvent = APP_PROPOSAL_EVENT[type]['DECLINED'];
    if (ProposalDeclinedHookEvent) {
      ctx.state.appEvents.push(new ProposalDeclinedHookEvent({
        proposalCmd: proposalCmd,
        proposalCtx: ctx.state.proposalsStackFrame
      }));
    } else {
      logWarn(`WARNING: No proposal hook event found for ${APP_PROPOSAL[type]} workflow at 'DECLINED' stage`);
    }

    ctx.state.proposalsStack.pop();
    ctx.state.proposalsStackFrame = ctx.state.proposalsStack[ctx.state.proposalsStack.length - 1] || null;
  }

});


module.exports = proposalCmdHandler;