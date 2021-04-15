import BaseCmdHandler from './../base/BaseCmdHandler'
import { APP_CMD } from '@deip/command-models';


class ProposalCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const proposalCmdHandler = new ProposalCmdHandler();


proposalCmdHandler.register(APP_CMD.CREATE_PROPOSAL, async (cmd, ctx) => {
  // TODO: create proposal model and check state of protocol proposal
  ctx.state.appEvents.push({ name: "ProposalCreated", payload: cmd.getCmdPayload() });

  const proposedCmds = cmd.getProposedCmds();
  await ProposalCmdHandler.HandleChain(proposedCmds, ctx);

  return cmd.getProtocolEntityId();
});


module.exports = proposalCmdHandler;