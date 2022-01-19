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
        ctx.successRes(status && status != 0 ? result.filter(p => p.proposal.status == status) : result);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
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
        ctx.successRes(proposal);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  acceptProposal = this.command({
    h: async (ctx) => {
      try {
        const msg = ctx.state.msg;
        await proposalCmdHandler.process(msg, ctx);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  declineProposal = this.command({
    h: async (ctx) => {
      try {
        const msg = ctx.state.msg;
        await proposalCmdHandler.process(msg, ctx);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });
}

const proposalsCtrl = new ProposalsController();

module.exports = proposalsCtrl;