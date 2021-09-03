import EventEmitter from 'events';
import { LEGACY_APP_EVENTS } from './../../constants';
import { handle, fire, wait } from './utils';
import { ProjectContentDtoService } from './../../services';
import ReviewService from './../../services/legacy/review';
import ReviewRequestService from './../../services/legacy/reviewRequest';


class ReviewHandler extends EventEmitter { }

const reviewHandler = new ReviewHandler();

reviewHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: reviewCreatedEvent, tenant } = source;

  const reviewService = new ReviewService();
  const projectContentDtoService = new ProjectContentDtoService();
  const reviewRequestService = new ReviewRequestService();

  const { reviewExternalId, researchContentExternalId, author, source: { offchain: { content } } } = reviewCreatedEvent.getSourceData();

  const researchContent = await projectContentDtoService.getProjectContent(researchContentExternalId);

  const reviewRef = await reviewService.createReviewRef({
    externalId: reviewExternalId,
    researchExternalId: researchContent.research_external_id,
    researchContentExternalId: researchContentExternalId,
    author: author,
    content: content
  });

  const expertReviewRequests = await reviewRequestService.getReviewRequestsByExpert(author, 'pending');
  const reviewRequest = expertReviewRequests.find(r => r.researchContentExternalId == researchContentExternalId);
  if (reviewRequest) {
    await reviewRequestService.updateReviewRequest(reviewRequest._id, {
      status: 'approved'
    })
  } 

  const review = await reviewService.getReview(reviewExternalId)
  return review;
  
}));


export default reviewHandler;