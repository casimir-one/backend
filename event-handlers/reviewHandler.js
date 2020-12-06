import EventEmitter from 'events';
import { APP_EVENTS } from './../constants';
import { handle, fire, wait } from './utils';
import ReviewService from './../services/review';


class ReviewHandler extends EventEmitter { }

const reviewHandler = new ReviewHandler();

reviewHandler.on(APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: reviewCreatedEvent, tenant } = source;

  const reviewService = new ReviewService();

  const { reviewExternalId, researchContentExternalId, author, source: { offchain: { content } } } = reviewCreatedEvent.getSourceData();

  const reviewRef = await reviewService.createReviewRef({
    externalId: reviewExternalId,
    researchContentExternalId: researchContentExternalId,
    author: author,
    content: content
  });
  
  const review = await reviewService.getReview(reviewExternalId)
  return review;
  
}));


export default reviewHandler;