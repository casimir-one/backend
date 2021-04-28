import BaseService from './base/BaseService';
import AwardWithdrawalRequest from './../schemas/awardWithdrawalRequest';

class GrantService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(AwardWithdrawalRequest, options);
  }

  async findAwardWithdrawalRequest(awardNumber, paymentNumber) {
    const result = await this.findOne({ awardNumber, paymentNumber });
    return result;
  }

}

export default GrantService;