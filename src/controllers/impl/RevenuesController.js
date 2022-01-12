import BaseController from '../base/BaseController';
import { RevenueDtoService } from '../../services';

const revenueDtoService = new RevenueDtoService();

class RevenuesController extends BaseController {
  getAssetRevenueHistory = this.query({
    h: async (ctx) => {
      try {
        const { symbol, cursor } = ctx.params;
        const history = await revenueDtoService.getAssetRevenueHistory(symbol, cursor);
        ctx.successRes(history);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getAccountRevenueHistoryByAsset = this.query({
    h: async (ctx) => {
      try {
        const { account, symbol, step, cursor, targetAsset } = ctx.params;
        const history = await revenueDtoService.getAccountRevenueHistoryByAsset(account, symbol, step, cursor, targetAsset);
        ctx.successRes(history);
      }
      catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getAccountRevenueHistory = this.query({
    h: async (ctx) => {
      try {
        const { account, cursor } = ctx.params;
        const history = await revenueDtoService.getAccountRevenueHistory(account, cursor);
        ctx.successRes(history);
      }
      catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });
}

const revenuesCtrl = new RevenuesController();

module.exports = revenuesCtrl;