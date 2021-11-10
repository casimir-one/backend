import BaseController from '../base/BaseController';
import { RevenueDtoService } from '../../services';

const revenueDtoService = new RevenueDtoService();

class RevenuesController extends BaseController {
  getAssetRevenueHistory = this.query({
    h: async (ctx) => {
      try {
        const { symbol, cursor } = ctx.params;
        const history = await revenueDtoService.getAssetRevenueHistory(symbol, cursor);
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


  getAccountRevenueHistoryByAsset = this.query({
    h: async (ctx) => {
      try {
        const { account, symbol, step, cursor, targetAsset } = ctx.params;
        const history = await revenueDtoService.getAccountRevenueHistoryByAsset(account, symbol, step, cursor, targetAsset);
        if (!history) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = history;
        ctx.status = 200;
      }
      catch (err) {
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
        const history = await revenueDtoService.getAccountRevenueHistory(account, cursor);
        if (!history) {
          ctx.status = 404;
          ctx.body = null;
          return;
        }
        ctx.body = history;
        ctx.status = 200;
      }
      catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });
}

const revenuesCtrl = new RevenuesController();

module.exports = revenuesCtrl;