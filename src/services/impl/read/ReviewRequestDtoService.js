import BaseService from './../../base/BaseService';
import ReviewRequestSchema from './../../../schemas/ReviewRequestSchema';

class ReviewRequestDtoService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ReviewRequestSchema, options);
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

  async getReviewRequestsByExpertAndProjectContent(expert, projectContentId) {
    const q = { expert, projectContentId: projectContentId };
    const result = await this.findOne(q);
    return result;
  }
}

export default ReviewRequestDtoService;