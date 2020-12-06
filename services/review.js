import deipRpc from '@deip/rpc-client';
import Review from './../schemas/review';
import ReviewRequest from './../schemas/reviewRequest';


class ReviewService {

  constructor() { }

  async mapReviews(chainReviews) {
    const reviews = await Review.find({ _id: { $in: chainReviews.map(r => r.external_id) } });
    return chainReviews
      .map((chainReview) => {
        const reviewRef = reviews.find(r => r._id.toString() == chainReview.external_id);
        return { ...chainReview, reviewRef: reviewRef ? reviewRef.toObject() : null };
      })
      .map((review) => {
        const override = review.reviewRef ? { content: review.reviewRef.content } : { content: "Not specified" };
        return { ...review, ...override };
      });
  }

  async getReview(reviewExternalId) {
    const chainReview = await deipRpc.api.getReviewAsync(reviewExternalId);
    if (!chainReview) return null;
    const result = await this.mapReviews([chainReview]);
    const [review] = result;
    return review;
  }

  async getReviewsByResearch(researchExternalId) {
    const chainReviews = await deipRpc.api.getReviewsByResearchAsync(researchExternalId);
    const reviews = await this.mapReviews(chainReviews);
    return reviews;
  }

  async getReviewsByResearchContent(researchContentExternalId) {
    const chainReviews = await deipRpc.api.getReviewsByResearchContentAsync(researchContentExternalId);
    const reviews = await this.mapReviews(chainReviews);
    return reviews;
  }  

  async getReviewsByAuthor(author) {
    const chainReviews = await deipRpc.api.getReviewsByAuthorAsync(author);
    const reviews = await this.mapReviews(chainReviews);
    return reviews;
  }  

  async createReviewRef({
    externalId,
    researchContentExternalId,
    author,
    content
  }) {

    const review = new Review({
      _id: externalId,
      researchContentExternalId,
      author,
      content
    });

    const savedReview = await review.save();
    // await ReviewRequest.update({ expert: author, contentId: researchContentExternalId }, { $set: { status: 'approved' } });

    return savedReview.toObject();
  }
  
}

export default ReviewService;