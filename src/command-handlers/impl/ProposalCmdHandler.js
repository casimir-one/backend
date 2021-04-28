import { APP_CMD, APP_PROPOSAL, CreateProposalCmd } from '@deip/command-models';
import { PROPOSAL_STATUS } from './../../constants';
import APP_PROPOSAL_EVENT from './../../events/base/AppProposalEvent';
import BaseCmdHandler from './../base/BaseCmdHandler';
import ProposalDomainService from './../../services/impl/write/ProposalDomainService';
import { ProposalCreatedEvent, ProposalSignaturesUpdatedEvent } from './../../events';


class ProposalCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const proposalCmdHandler = new ProposalCmdHandler();

const proposalDomainService = new ProposalDomainService();

proposalCmdHandler.register(APP_CMD.CREATE_PROPOSAL, async (cmd, ctx) => {
  const { entityId: proposalId, creator, type } = cmd.getCmdPayload();

  const proposal = await proposalDomainService.createProposal({
    proposalId: proposalId,
    proposalCmd: cmd,
    type: type,
    creator: creator
  });
  
  ctx.state.appEvents.push(new ProposalCreatedEvent({
    proposalId: proposal._id,
    status: proposal.status,
    type: proposal.type,
    requiredApprovals: proposal.requiredApprovals,
    proposalCmd: cmd,
    proposalCtx: ctx.state.proposalsStackFrame
  }));

  
  const ProposalTypedEvent = APP_PROPOSAL_EVENT[proposal.type];
  if (ProposalTypedEvent) {
    ctx.state.appEvents.push(new ProposalTypedEvent({
      proposalCmd: cmd,
      proposalCtx: ctx.state.proposalsStackFrame
    }));
  } else {
    console.warn(`WARNING: No proposal specific event found for ${APP_PROPOSAL[proposal.type]} workflow`);
  }
  
});


proposalCmdHandler.register(APP_CMD.UPDATE_PROPOSAL, async (cmd, ctx) => {
  const { entityId: proposalId } = cmd.getCmdPayload();

  const proposal = await proposalDomainService.updateProposal(proposalId, {});
  const proposalCmd = CreateProposalCmd.Deserialize(proposal.cmd);
  const proposedCmds = proposalCmd.getProposedCmds();
  const type = proposalCmd.getProposalType();

  ctx.state.appEvents.push(new ProposalSignaturesUpdatedEvent({
    proposalId: proposalId,
    proposalCtx: ctx.state.proposalsStackFrame
  }));

  if (proposal.status == PROPOSAL_STATUS.APPROVED) {
    
    ctx.state.proposalsStack.push({ proposalId, type, proposedCmds });
    ctx.state.proposalsStackFrame = ctx.state.proposalsStack[ctx.state.proposalsStack.length - 1];
    
    await ProposalCmdHandler.HandleChain(proposedCmds, ctx);
    
    ctx.state.proposalsStack.pop();
    ctx.state.proposalsStackFrame = ctx.state.proposalsStack[ctx.state.proposalsStack.length - 1] || null;
  }

});


module.exports = proposalCmdHandler;