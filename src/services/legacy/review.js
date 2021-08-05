import deipRpc from '@deip/rpc-client';
import BaseService from './../base/BaseService';
import ReviewSchema from './../../schemas/ReviewSchema';
import config from './../../config';
import { ChainService } from '@deip/chain-service';

class ReviewService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ReviewSchema, options);
  }

  async mapReviews(reviews) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const chainReviews = await chainApi.getReviewsAsync(reviews.map(r => r._id));

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

  async getReview(externalId) {
    const review = await this.findOne({ _id: externalId });
    if (!review) return null;
    const results = await this.mapReviews([review]);
    const [result] = results;
    return result;
  }

  async getReviewsByResearch(researchExternalId) {
    const reviews = await this.findMany({ researchExternalId: researchExternalId });
    if (!reviews.length) return [];
    const result = await this.mapReviews(reviews);
    return result;
  }

  async getReviewsByResearchContent(researchContentExternalId) {
    const reviews = await this.findMany({ researchContentExternalId: researchContentExternalId })
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

  async createReviewRef({
    externalId,
    researchExternalId,
    researchContentExternalId,
    author,
    content
  }) {

    const result = await this.createOne({
      _id: externalId,
      researchContentExternalId,
      researchExternalId,
      author,
      content
    });

    return result;
  }


  async getReviewVotes(reviewExternalId) {
    const review = await this.getReview(reviewExternalId);
    if (!review) return [];
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
    const result = await chainApi.getReviewVotesByReviewIdAsync(review.id)
    return result;
  }

  
}

export default ReviewService;