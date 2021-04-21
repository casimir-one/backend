import ReviewRequestService from './../../services/reviewRequest';
import ReviewService from './../../services/review';
import ReviewRequestedEvent from './../../events/legacy/reviewRequestedEvent';


const getReviewRequestsByExpert = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const expert = ctx.params.username;
  const status = ctx.query.status;

  try {

    const reviewRequestService = new ReviewRequestService();
    if (expert !== jwtUsername) {
      // ctx.status = 403;
      // ctx.body = `You have no permission to get '${username}' review requests`;
      // return;
      ctx.status = 200;
      ctx.body = [];
      return;
    }

    const reviewRequests = await reviewRequestService.getReviewRequestsByExpert(expert, status);
    ctx.status = 200;
    ctx.body = reviewRequests;

  } catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }

};


const getReviewRequestsByRequestor = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const requestor = ctx.params.username;
  const status = ctx.query.status;

  try {

    const reviewRequestService = new ReviewRequestService();
    if (requestor !== jwtUsername) {
      // ctx.status = 403;
      // ctx.body = `You have no permission to get '${username}' review requests`;
      // return;
      ctx.status = 200;
      ctx.body = [];
      return;
    }

    const reviewRequests = await reviewRequestService.getReviewRequestsByRequestor(requestor, status);
    ctx.status = 200;
    ctx.body = reviewRequests;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};


const createReviewRequest = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { researchContentExternalId, expert } = ctx.request.body;
  const requestor = jwtUsername;

  try {
    const reviewRequestService = new ReviewRequestService();
    const reviewService = new ReviewService();

    if (requestor === expert) {
      ctx.status = 400;
      ctx.body = `You can't request review from yourself`;
      return;
    }

    const existingRequest = await reviewRequestService.getReviewRequestsByExpertAndResearchContent(expert, researchContentExternalId)
    if (existingRequest) {
      ctx.status = 400;
      ctx.body = 'Review with such params already requested';
      return;
    }

    const researchContentReviews = await reviewService.getReviewsByResearchContent(researchContentExternalId);
    const existingReview = researchContentReviews.find(r => r.author === expert);
    if (existingReview) {
      ctx.status = 400;
      ctx.body = 'Expert already reviewed this content';
      return;
    }

    const reviewRequest = await reviewRequestService.createReviewRequest({
      expert,
      researchContentExternalId,
      requestor,
      status: 'pending'
    });

    const reviewRequestedEvent = new ReviewRequestedEvent([], { reviewRequest });
    ctx.state.events.push(reviewRequestedEvent);

    ctx.status = 200;
    ctx.body = reviewRequest;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }

  await next();
  
};


const denyReviewRequest = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const requestId = ctx.params.id;

  try {
    const reviewRequestService = new ReviewRequestService();

    const reviewRequests = await reviewRequestService.getReviewRequestsByExpert(jwtUsername);
    if (!reviewRequests.some(r => r._id == requestId)) {
      ctx.status = 404;
      ctx.body = `Review request ${requestId} for expert ${jwtUsername} is not found`;
      return;
    }

    await reviewRequestService.updateReviewRequest(requestId, {
      status: 'denied'
    });

    ctx.status = 201;
    ctx.body = "";

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }

};

export default {
  getReviewRequestsByExpert,
  getReviewRequestsByRequestor,
  createReviewRequest,
  denyReviewRequest
}