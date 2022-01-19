import BaseController from '../base/BaseController';
import { InvestmentOpportunityDtoService, InvestmentOpportunityParticipationDtoService } from '../../services';
import { invstOppCmdHandler } from './../../command-handlers';
import { APP_CMD } from '@deip/constants';
import { BadRequestError, NotFoundError } from './../../errors';

const invstOppDtoService = new InvestmentOpportunityDtoService();
const invstOppParticipationDtoService = new InvestmentOpportunityParticipationDtoService();

class InvestmentOpportunityController extends BaseController {

  createInvstOpp = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_INVESTMENT_OPPORTUNITY || cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);

          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();
            if (!proposedCmds.some(cmd => cmd.getCmdNum() === APP_CMD.CREATE_INVESTMENT_OPPORTUNITY)) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.CREATE_INVESTMENT_OPPORTUNITY]} protocol cmd`);
            }
          }
        };

        const msg = ctx.state.msg;

        await invstOppCmdHandler.process(msg, ctx, validate);
        
        ctx.successRes();
        
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  participateInvstOpp = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.INVEST);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };

        const msg = ctx.state.msg;

        await invstOppCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  getInvstOpp = this.query({
    h: async (ctx) => {
      try {
        const { investmentOpportunityId } = ctx.params;
        const tokeSale = await invstOppDtoService.getInvstOpp(investmentOpportunityId);
        if (!tokeSale) {
          throw new NotFoundError(`InvstOpp "${investmentOpportunityId}" is not found`);
        }
        ctx.successRes(tokeSale);
      }
      catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getInvstOppByProject = this.query({
    h: async (ctx) => {
      try {
        const projectId = ctx.params.projectId;
        const tokenSales = await invstOppDtoService.getInvstOppByProject(projectId);
        ctx.successRes(tokenSales);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getInvstOppParticipations = this.query({
    h: async (ctx) => {
      try {
        const investmentOpportunityId = ctx.params.investmentOpportunityId;
        const investments = await invstOppParticipationDtoService.getInvstOppParticipations(investmentOpportunityId);
        ctx.successRes(investments);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getInvstOppParticipationsByProject = this.query({
    h: async (ctx) => {
      try {
        const projectId = ctx.params.projectId;
        const investments = await invstOppParticipationDtoService.getInvstOppParticipationsByProject(projectId);
        ctx.successRes(investments);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getInvstOppParticipationsHistoryByAccount = this.query({
    h: async (ctx) => {
      try {
        const { account } = ctx.params;
        const history = await invstOppParticipationDtoService.getInvstOppParticipationsHistoryByAccount(account);
        ctx.successRes(history);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });
}

const invstOppCtrl = new InvestmentOpportunityController();

module.exports = invstOppCtrl;