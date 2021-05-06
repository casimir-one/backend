import BaseService from './../base/BaseService';
import AwardWithdrawalRequestSchema from './../../schemas/AwardWithdrawalRequestSchema';

class GrantService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(AwardWithdrawalRequestSchema, options);
  }

  async findAwardWithdrawalRequest(awardNumber, paymentNumber) {
    const result = await this.findOne({ awardNumber, paymentNumber });
    return result;
  }

}

export default GrantService;