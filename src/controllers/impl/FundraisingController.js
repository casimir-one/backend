import BaseController from '../base/BaseController';
import { FundraisingDtoService } from '../../services';
import { tokenSaleCmdHandler } from './../../command-handlers';
import {APP_CMD} from '@deip/command-models';
import { BadRequestError, ConflictError } from './../../errors';

const fundraisingDtoService = new FundraisingDtoService();

class FundraisingController extends BaseController {
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

        await tokenSaleCmdHandler.process(msg, ctx, validate);
        
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

        await tokenSaleCmdHandler.process(msg, ctx, validate);

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

  getDomains = this.query({
    h: async (ctx) => {
      try {
        const domains = await domainDtoService.getDomains();
        ctx.status = 200
        ctx.body = domains;
    
      } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getProjectTokenSalesByProject = this.query({
    h: async (ctx) => {
      try {
        const projectId = ctx.params.projectId;
        const tokenSales = await fundraisingDtoService.getProjectTokenSalesByProject(projectId);
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
        const contributions = await fundraisingDtoService.getProjectTokenSaleContributions(projectTokenSaleExternalId);
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
        const contributions = await fundraisingDtoService.getProjectTokenSaleContributionsByProject(projectId);
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
        const history = await fundraisingDtoService.getAccountRevenueHistoryByAsset(account, symbol, step, cursor, targetAsset);
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
        const history = await fundraisingDtoService.getAccountRevenueHistory(account, cursor);
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
        const history = await fundraisingDtoService.getAccountContributionsHistory(account);
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
        const history = await fundraisingDtoService.getAssetRevenueHistory(symbol, cursor);
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
        const tokeSale = await fundraisingDtoService.getProjectTokenSale(tokenSaleId);
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

const fundraisingCtrl = new FundraisingController();

module.exports = fundraisingCtrl;