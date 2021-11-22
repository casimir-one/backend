import BaseService from './../../base/BaseService';
import ReviewSchema from './../../../schemas/ReviewSchema';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';

class ReviewDtoService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ReviewSchema, options);
  }

  async mapReviews(reviews) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainReviews = await chainRpc.getReviewsAsync(reviews.map(r => r._id));

    return chainReviews
      .map((chainReview) => {
        const reviewRef = reviews.find(r => r._id.toString() == chainReview.external_id);
        return { ...chainReview, reviewRef: reviewRef ? reviewRef : null };
      })
      .map((review) => {
        const override = review.reviewRef ? { content: review.reviewRef.content } : { content: "Not specified" };
        return { ...review, ...override };
      });
  }

  async getReview(id) {
    const review = await this.findOne({ _id: id });
    if (!review) return null;
    const results = await this.mapReviews([review]);
    const [result] = results;
    return result;
  }

  async getReviewsByProject(projectId) {
    const reviews = await this.findMany({ researchExternalId: projectId });
    if (!reviews.length) return [];
    const result = await this.mapReviews(reviews);
    return result;
  }

  async getReviewsByProjectContent(projectContentId) {
    const reviews = await this.findMany({ researchContentExternalId: projectContentId })
    if (!reviews.length) return [];
    const result = await this.mapReviews(reviews);
    return result;
  }

  async getReviewsByAuthor(author) {
    const reviews = await this.findMany({ author: author });
    if (!reviews.length) return [];
    const result = await this.mapReviews(reviews);
    return result;
  }  

  async getReviewUpvotes(reviewId) {
    const review = await this.getReview(reviewId);
    if (!review) return [];
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const result = await chainRpc.getReviewVotesByReviewIdAsync(review.id)
    return result;
  }
}

export default ReviewDtoService;