import deipRpc from '@deip/rpc-client';
import BaseReadModelService from './base';
import ReviewRequest from './../schemas/reviewRequest';


class ReviewRequestService extends BaseReadModelService {

  constructor() { 
    super(ReviewRequest); 
  }


  async getReviewRequestsByExpert(expert, status = null) {
    const q = { expert };
    if (status) {
      q.status = status;
    }
    const result = await this.findMany(q);
    return result;
  }


  async getReviewRequestsByRequestor(requestor, status = null) {
    const q = { requestor };
    if (status) {
      q.status = status;
    }
    const result = await this.findMany(q);
    return result;
  }


  async getReviewRequestsByExpertAndResearchContent(expert, researchContentExternalId) {
    const q = { expert, researchContentExternalId };
    const result = await this.findOne(q);
    return result;
  }

  
  async createReviewRequest({
    expert,
    researchContentExternalId,
    requestor,
    status
  }) {

    const result = await this.createOne({
      expert,
      researchContentExternalId,
      requestor,
      status
    });

    return result;
  }


  async updateReviewRequest(id, {
    status
  }) {

    const result = await this.updateOne({ _id: id }, {
      status
    });

    return result;
  }


}

export default ReviewRequestService;