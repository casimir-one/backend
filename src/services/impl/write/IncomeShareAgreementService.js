import BaseService from './../../base/BaseService';
import IncomeShareAgreementSchema from './../../../schemas/IncomeShareAgreementSchema';

class IncomeShareAgreementService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(IncomeShareAgreementSchema, options);
  }

  async createIncomeShareAgreement({
    incomeShareAgreementId,
    creator,
    parties,
    hash,
    startTime,
    endTime,
    acceptedByParties,
    type,
    terms,
    status,
    proposalId
  }) {

    const result = await this.createOne({
      _id: incomeShareAgreementId,
      creator,
      parties,
      hash,
      startTime,
      endTime,
      acceptedByParties,
      type,
      terms,
      status,
      proposalId
    });

    return result;
  }

  async updateIncomeShareAgreement({
    _id,
    status,
    acceptedByParties
  }) {
    const result = await this.updateOne({ _id }, {
      status,
      acceptedByParties
    });

    return result;
  }

}

export default IncomeShareAgreementService;