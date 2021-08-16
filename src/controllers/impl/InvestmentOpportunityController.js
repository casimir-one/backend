import BaseController from '../base/BaseController';
import { InvestmentOpportunityDtoService } from '../../services';
import { investmentOppCmdHandler } from './../../command-handlers';
import { APP_CMD } from '@deip/constants';
import { BadRequestError } from './../../errors';

const investmentOppDtoService = new InvestmentOpportunityDtoService();

class InvestmentOpportunityController extends BaseController {

  createProjectTokenSale = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_PROJECT_TOKEN_SALE || cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          console.log(appCmd)

          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();
            if (!proposedCmds.some(cmd => cmd.getCmdNum() === APP_CMD.CREATE_PROJECT_TOKEN_SALE)) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.CREATE_PROJECT_TOKEN_SALE]} protocol cmd`);
            }
          }
        };

        const msg = ctx.state.msg;

        await investmentOppCmdHandler.process(msg, ctx, validate);
        
        ctx.status = 200;
        ctx.body = { model: 'ok' };
        
      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  createProjectTokenSaleContribution = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CONTRIBUTE_PROJECT_TOKEN_SALE);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };

        const msg = ctx.state.msg;

        await investmentOppCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = {
          model: "ok"
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  getProjectTokenSalesByProject = this.query({
    h: async (ctx) => {
      try {
        const projectId = ctx.params.projectId;
        const tokenSales = await investmentOppDtoService.getProjectTokenSalesByProject(projectId);
        ctx.status = 200;
        ctx.body = tokenSales;
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getProjectTokenSaleContributions = this.query({
    h: async (ctx) => {
      try {
        const projectTokenSaleExternalId = ctx.params.projectTokenSaleExternalId;
        const contributions = await investmentOppDtoService.getProjectTokenSaleContributions(projectTokenSaleExternalId);
        ctx.status = 200;
        ctx.body = contributions;
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getProjectTokenSaleContributionsByProject = this.query({
    h: async (ctx) => {
      try {
        const projectId = ctx.params.projectId;
        const contributions = await investmentOppDtoService.getProjectTokenSaleContributionsByProject(projectId);
        ctx.status = 200;
        ctx.body = contributions;
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getAccountRevenueHistoryByAsset = this.query({
    h: async (ctx) => {
      try {
        const { account, symbol, step, cursor, targetAsset } = ctx.params;
        const history = await investmentOppDtoService.getAccountRevenueHistoryByAsset(account, symbol, step, cursor, targetAsset);
        if (!history) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = history;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getAccountRevenueHistory = this.query({
    h: async (ctx) => {
      try {
        const { account, cursor } = ctx.params;
        const history = await investmentOppDtoService.getAccountRevenueHistory(account, cursor);
        if (!history) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = history;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getAccountContributionsHistory = this.query({
    h: async (ctx) => {
      try {
        const { account } = ctx.params;
        const history = await investmentOppDtoService.getAccountContributionsHistory(account);
        if (!history) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = history;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getContributionsHistoryByTokenSale = this.query({
    h: async (ctx) => {
      try {
        const tokenSaleId = ctx.params.tokenSaleId;
        const history = await investmentOppDtoService.getContributionsHistoryByTokenSale(tokenSaleId);
        if (!history) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = history;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getAssetRevenueHistory = this.query({
    h: async (ctx) => {
      try {
        const { symbol, cursor } = ctx.params;
        const history = await investmentOppDtoService.getAssetRevenueHistory(symbol, cursor);
        if (!history) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = history;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getProjectTokenSale = this.query({
    h: async (ctx) => {
      try {
        const { tokenSaleId } = ctx.params;
        const tokeSale = await investmentOppDtoService.getProjectTokenSale(tokenSaleId);
        if (!tokeSale) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = tokeSale;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });
}

const investmentOppCtrl = new InvestmentOpportunityController();

module.exports = investmentOppCtrl;