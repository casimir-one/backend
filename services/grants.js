import BaseReadModelService from './base';
import AwardWithdrawalRequest from './../schemas/awardWithdrawalRequest';

class GrantService extends BaseReadModelService {

  constructor() { 
    super(AwardWithdrawalRequest);
  }

  async findAwardWithdrawalRequest(awardNumber, paymentNumber) {
    const result = await this.findOne({ awardNumber, paymentNumber });
    return result;
  }

}

export default GrantService;