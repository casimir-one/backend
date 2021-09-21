import BaseService from './../../base/BaseService';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import IncomeShareAgreementSchema from './../../../schemas/IncomeShareAgreementSchema';

class IncomeShareAgreementDtoService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(IncomeShareAgreementSchema, options);
  }

  async mapIncomeShareAgreements(contracts) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const chainContracts = await Promise.all(contracts.map(l => chainApi.getContractAgreementAsync(l._id)));
    const result = [];
    chainContracts
      .forEach((chainContract) => {
        if (chainContract) {
          const contract = contracts.find(c => c._id == chainContract.external_id);
          result.push({ ...contract, chainContract });
        }
      });

    return result;
  }

  async getIncomeShareAgreement(id) {
    const incomeShareAgreement = await this.findOne({ _id: id });
    if (!incomeShareAgreement) return null;
    const result = await this.mapIncomeShareAgreements([incomeShareAgreement])
    return result[0];
  }

  async getIncomeShareAgreements() {
    const incomeShareAgreements = await this.findMany();
    const result = await this.mapIncomeShareAgreements(incomeShareAgreements)
    return result;
  }

  async getIncomeShareAgreementsListByCreator(creator) {
    const incomeShareAgreements = await this.findMany({ creator });
    const result = await this.mapIncomeShareAgreements(incomeShareAgreements)
    return result;
  }
}

export default IncomeShareAgreementDtoService;