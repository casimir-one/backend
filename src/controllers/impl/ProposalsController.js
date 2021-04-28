import BaseController from './../base/BaseController';
import proposalCmdHandler from './../../command-handlers/impl/ProposalCmdHandler';


class ProposalsController extends BaseController {

  updateProposal = this.command({
    h: async (ctx) => {
      try {
        const msg = ctx.state.msg;
        await proposalCmdHandler.process(msg, ctx);

        ctx.status = 200;
        ctx.body = { model: "ok" };

      } catch (err) {
        ctx.status = 500;
        ctx.body = err.message;
      }
    }
  });

}


const proposalsCtrl = new ProposalsController();


module.exports = proposalsCtrl;