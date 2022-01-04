import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { ReviewRequestService, ReviewRequestDtoService, ProjectContentDtoService, ReviewService } from './../../services';
import { REVIEW_REQUEST_STATUS } from './../../constants';

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
    status: REVIEW_REQUEST_STATUS.PENDING
  });
});

reviewEventHandler.register(APP_EVENT.REVIEW_REQUEST_DECLINED, async (event) => {

  const { reviewRequestId } = event.getEventPayload();

  await reviewRequestService.updateReviewRequest({
    _id: reviewRequestId,
    status: REVIEW_REQUEST_STATUS.DENIED
  });
});

reviewEventHandler.register(APP_EVENT.REVIEW_CREATED, async (event) => {

  const {
    entityId: reviewId,
    author,
    projectContentId,
    content,
    assessment,
    domains
  } = event.getEventPayload();

  const projectContentRef = await projectContentDtoService.getProjectContentRef(projectContentId);

  await reviewService.createReview({
    reviewId,
    projectId: projectContentRef.projectId,
    projectContentId,
    author,
    content
  });

  const expertReviewRequests = await reviewRequestDtoService.getReviewRequestsByExpert(author, REVIEW_REQUEST_STATUS.PENDING);
  const reviewRequest = expertReviewRequests.find(r => r.projectContentId == projectContentId);
  if (reviewRequest) {
    await reviewRequestService.updateReviewRequest({
      _id: reviewRequest._id,
      status: REVIEW_REQUEST_STATUS.APPROVED
    })
  } 
});

module.exports = reviewEventHandler;