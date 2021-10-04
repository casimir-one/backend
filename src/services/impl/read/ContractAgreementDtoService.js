import BaseService from './../../base/BaseService';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import ContractAgreementSchema from './../../../schemas/ContractAgreementSchema';

class ContractAgreementDtoService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ContractAgreementSchema, options);
  }

  async mapContractAgreements(contracts) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const chainContracts = await Promise.all(contracts.map(l => chainApi.getContractAgreementAsync(l._id)));
    const result = [];
    contracts
      .forEach((contract) => {
        const chainContract = chainContracts.find(c => c ? c.external_id == contract._id : false);
        result.push({ ...contract, chainContract });
      });

    return result;
  }

  async getContractAgreement(id) {
    const contractAgreement = await this.findOne({ _id: id });
    if (!contractAgreement) return null;
    const result = await this.mapContractAgreements([contractAgreement])
    return result[0];
  }

  async getContractAgreements({
    parties,
    type,
    status
  } = {}) {
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (Array.isArray(parties) && parties.length) query.parties = { $all : [...parties] };
    const contractAgreements = await this.findMany(query);
    const result = await this.mapContractAgreements(contractAgreements)
    return result;
  }

  async getContractAgreementsListByCreator(creator) {
    const contractAgreements = await this.findMany({ creator });
    const result = await this.mapContractAgreements(contractAgreements)
    return result;
  }
}

export default ContractAgreementDtoService;