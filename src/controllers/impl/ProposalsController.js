import BaseController from './../base/BaseController';
import proposalCmdHandler from './../../command-handlers/impl/ProposalCmdHandler';
import { ProposalDtoService } from './../../services';
import { NotFoundError } from './../../errors';

const proposalDtoService = new ProposalDtoService();

class ProposalsController extends BaseController {
  getAccountProposals = this.query({
    h: async (ctx) => {
      try {
        const status = ctx.params.status;
        const username = ctx.params.username;

        let result = await proposalDtoService.getAccountProposals(username);
        result.sort(function (a, b) {
          return new Date(b.proposal.created_at) - new Date(a.proposal.created_at);
        });
        ctx.body = status && status != 0 ? result.filter(p => p.proposal.status == status) : result;
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getProposalById = this.query({
    h: async (ctx) => {
      try {
        const proposalId = ctx.params.proposalId;
        const proposal = await proposalDtoService.getProposal(proposalId);
        if (!proposal) {
          throw new NotFoundError(`Proposal "${proposalId}" id is not found`);
        }
        ctx.body = proposal;
      } catch (err) {
        console.log(err);
        ctx.status = err.httpStatus || 500;
        ctx.body = err;
      }
    }
  });

  acceptProposal = this.command({
    h: async (ctx) => {
      try {
        const msg = ctx.state.msg;
        await proposalCmdHandler.process(msg, ctx);

        ctx.status = 200;
        ctx.body = {
          model: "ok"
        };

      } catch (err) {
        ctx.status = 500;
        ctx.body = err.message;
      }
    }
  });


  declineProposal = this.command({
    h: async (ctx) => {
      try {
        const msg = ctx.state.msg;
        await proposalCmdHandler.process(msg, ctx);

        ctx.status = 200;
        ctx.body = {
          model: "ok"
        };

      } catch (err) {
        ctx.status = 500;
        ctx.body = err.message;
      }
    }
  });
}

const proposalsCtrl = new ProposalsController();

module.exports = proposalsCtrl;