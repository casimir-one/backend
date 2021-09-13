import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { ReviewRequestService, ReviewRequestDtoService, ProjectContentDtoService, ReviewService } from './../../services';

class ReviewEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const reviewEventHandler = new ReviewEventHandler();
const reviewRequestService = new ReviewRequestService();
const reviewRequestDtoService = new ReviewRequestDtoService();
const reviewService = new ReviewService();
const projectContentDtoService = new ProjectContentDtoService();

reviewEventHandler.register(APP_EVENT.REVIEW_REQUEST_CREATED, async (event) => {

  const {
    expert,
    requestor,
    projectContentId,
  } = event.getEventPayload();

  const newReviewRequest = await reviewRequestService.createReviewRequest({
    expert,
    requestor,
    projectContentId,
    status: 'pending'
  });
});

reviewEventHandler.register(APP_EVENT.REVIEW_REQUEST_DECLINED, async (event) => {

  const { reviewRequestId } = event.getEventPayload();

  await reviewRequestService.updateReviewRequest({
    _id: reviewRequestId,
    status: 'denied'
  });
});

reviewEventHandler.register(APP_EVENT.REVIEW_CREATED, async (event) => {

  const {
    entityId: reviewId,
    author,
    projectContentId,
    content,
    weight,
    assessment,
    disciplines
  } = event.getEventPayload();

  const projectContentRef = await projectContentDtoService.getProjectContentRef(projectContentId);

  const reviewRef = await reviewService.createReview({
    reviewId,
    projectId: projectContentRef.researchExternalId,
    projectContentId,
    author,
    content
  });

  const expertReviewRequests = await reviewRequestDtoService.getReviewRequestsByExpert(author, 'pending');
  const reviewRequest = expertReviewRequests.find(r => r.projectContentId == projectContentId);
  if (reviewRequest) {
    await reviewRequestService.updateReviewRequest({
      _id: reviewRequest._id,
      status: 'approved'
    })
  } 
});

module.exports = reviewEventHandler;