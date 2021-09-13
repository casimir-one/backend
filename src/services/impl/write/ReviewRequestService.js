import BaseService from './../../base/BaseService';
import ReviewRequestSchema from './../../../schemas/ReviewRequestSchema';

class ReviewRequestService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ReviewRequestSchema, options);
  }

  async createReviewRequest({
    expert,
    projectContentId,
    requestor,
    status
  }) {

    const result = await this.createOne({
      expert,
      projectContentId,
      requestor,
      status
    });

    return result;
  }

  async updateReviewRequest({
    _id,
    status
  }) {
    const result = await this.updateOne({ _id }, {
      status
    });

    return result;
  }
}

export default ReviewRequestService;