import BaseController from '../base/BaseController';
import { NotFoundError } from '../../errors';
import { IncomeShareAgreementDtoService } from '../../services';

const incomeShareAgreementDtoService = new IncomeShareAgreementDtoService();

class IncomeShareAgreementController extends BaseController {

  getIncomeShareAgreement = this.query({
    h: async (ctx) => {
      try {
        const incomeShareAgreementId = ctx.params.incomeShareAgreementId;
        const incomeShareAgreement = await incomeShareAgreementDtoService.getIncomeShareAgreement(incomeShareAgreementId);
        if (!incomeShareAgreement) {
          throw new NotFoundError(`IncomeShareAgreement "${incomeShareAgreementId}" id is not found`);
        }

        ctx.body = incomeShareAgreement;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getIncomeShareAgreementsListByCreator = this.query({
    h: async (ctx) => {
      try {
        const creator = ctx.params.creator;
        const incomeShareAgreementsList = await incomeShareAgreementDtoService.getIncomeShareAgreementsListByCreator(creator);

        ctx.body = incomeShareAgreementsList;
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

const incomeShareAgreementCtrl = new IncomeShareAgreementController();

module.exports = incomeShareAgreementCtrl;