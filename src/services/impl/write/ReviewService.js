import BaseService from './../../base/BaseService';
import ReviewSchema from './../../../schemas/ReviewSchema';

class ReviewService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ReviewSchema, options);
  }

  async createReview({
    reviewId,
    projectId,
    projectContentId,
    author,
    content
  }) {

    const result = await this.createOne({
      _id: reviewId,
      projectContentId,
      projectId,
      author,
      content
    });

    return result;
  }

  async getReview(id) {
    const review = await this.findOne({ _id: id });
    return review;
  }

  async getReviewsByProjectContent(projectContentId) {
    const reviews = await this.findMany({ projectContentId: projectContentId });
    return reviews;
  }

}

export default ReviewService;