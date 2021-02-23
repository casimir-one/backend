import deipRpc from '@deip/rpc-client';
import BaseReadModelService from './base';
import Review from './../schemas/review';


class ReviewService extends BaseReadModelService {

  constructor(options = { scoped: true }) { 
    super(Review, options); 
  }

  async mapReviews(reviews) {
    const chainReviews = await deipRpc.api.getReviewsAsync(reviews.map(r => r._id));

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
    const result = await this.mapReviews(reviews);
    return result;
  }

  async getReviewsByResearchContent(researchContentExternalId) {
    const reviews = await this.findMany({ researchContentExternalId: researchContentExternalId });
    const result = await this.mapReviews(reviews);
    return result;
  }

  async getReviewsByAuthor(author) {
    const reviews = await this.findMany({ author: author });
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
    if (!review) {
      return [];
    }
    const result = await deipRpc.api.getReviewVotesByReviewIdAsync(review.id)
    return result;
  }

  
}

export default ReviewService;