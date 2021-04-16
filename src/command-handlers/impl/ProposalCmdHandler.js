import { APP_CMD } from '@deip/command-models';
import BaseCmdHandler from './../base/BaseCmdHandler'
import { ProposalCreatedEvent } from './../../events';


class ProposalCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const proposalCmdHandler = new ProposalCmdHandler();


proposalCmdHandler.register(APP_CMD.CREATE_PROPOSAL, async (cmd, ctx) => {
  // TODO: create proposal model and check state of protocol proposal here

  ctx.state.appEvents.push(new ProposalCreatedEvent(cmd.getCmdPayload()));
  const proposedCmds = cmd.getProposedCmds();
  await ProposalCmdHandler.HandleChain(proposedCmds, ctx);

  return cmd.getProtocolEntityId();
});


module.exports = proposalCmdHandler;