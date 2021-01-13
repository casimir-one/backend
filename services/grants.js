import BaseReadModelService from './base';
import AwardWithdrawalRequest from './../schemas/awardWithdrawalRequest';

class GrantService extends BaseReadModelService {

  constructor() { 
    super(AwardWithdrawalRequest);
  }

  async findAwardWithdrawalRequest(awardNumber, paymentNumber) {
    const withdrawal = await this.findOne({ awardNumber, paymentNumber });
    return withdrawal;
  }

}

export default GrantService;