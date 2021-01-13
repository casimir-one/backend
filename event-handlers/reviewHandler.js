import EventEmitter from 'events';
import { APP_EVENTS } from './../constants';
import { handle, fire, wait } from './utils';
import ResearchContentService from './../services/researchContent';
import ReviewService from './../services/review';
import ReviewRequest from './../schemas/reviewRequest';


class ReviewHandler extends EventEmitter { }

const reviewHandler = new ReviewHandler();

reviewHandler.on(APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: reviewCreatedEvent, tenant } = source;

  const reviewService = new ReviewService();
  const researchContentService = new ResearchContentService();

  const { reviewExternalId, researchContentExternalId, author, source: { offchain: { content } } } = reviewCreatedEvent.getSourceData();

  const researchContent = await researchContentService.getResearchContent(researchContentExternalId);

  const reviewRef = await reviewService.createReviewRef({
    externalId: reviewExternalId,
    researchExternalId: researchContent.research_external_id,
    researchContentExternalId: researchContentExternalId,
    author: author,
    content: content
  });

  // TODO: move to service
  await ReviewRequest.update({ expert: author, researchContentExternalId: researchContentExternalId }, { $set: { status: 'approved' } });
  
  const review = await reviewService.getReview(reviewExternalId)
  return review;
  
}));


export default reviewHandler;