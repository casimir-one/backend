import deipRpc from '@deip/rpc-client';
import ReviewRequest from './../schemas/reviewRequest';
import ACTIVITY_LOG_TYPE from './../constants/activityLogType';
import USER_NOTIFICATION_TYPE from './../constants/userNotificationType';
import userNotificationHandler from './../event-handlers/userNotificationHandler';

const getReviewRequestsByExpert = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;

  if (username !== jwtUsername) {
    // ctx.status = 403;
    // ctx.body = `You have no permission to get '${username}' review requests`;
    // return;
    ctx.status = 200;
    ctx.body = [];
    return;
  }

  const query = {
    expert: username,
  };
  if (ctx.query.status) {
    query.status = ctx.query.status;
  }
  const reviewRequests = await ReviewRequest.find(query);

  ctx.status = 200;
  ctx.body = reviewRequests;
};

const getReviewRequestsByRequestor = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;

  if (username !== jwtUsername) {
    // ctx.status = 403;
    // ctx.body = `You have no permission to get '${username}' review requests`;
    // return;
    ctx.status = 200;
    ctx.body = [];
    return;
  }

  const query = {
    requestor: username,
  };

  if (ctx.query.status) {
    console.log(ctx.query.status)
    console.log("3fhuefnu3unr")
    query.status = ctx.query.status;
  }
  const reviewRequests = await ReviewRequest.find(query);

  ctx.status = 200;
  ctx.body = reviewRequests;
};

const createReviewRequest = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const {
    contentId, expert,
  } = ctx.request.body;
  const requestor = jwtUsername;

  if (jwtUsername === expert) {
    ctx.status = 400;
    ctx.body = `You can't request review from yourself`;
    return;
  }
  const exists = await ReviewRequest.findOne({
    expert, contentId,
  });
  if (exists) {
    ctx.status = 400;
    ctx.body = 'Review with such params already requested';
    return;
  }
  const contentReviews = await deipRpc.api.getReviewsByResearchContentAsync(contentId);
  const existingReview = contentReviews.find(r => r.author === expert);
  if (existingReview) {
    ctx.status = 400;
    ctx.body = 'Expert already reviewed this content';
    return;
  }

  const reviewRequest = new ReviewRequest({
    expert, 
    contentId,
    requestor: requestor,
    status: 'pending'
  });
  const savedReviewRequest = await reviewRequest.save();
  
  userNotificationHandler.emit(USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW_REQUEST, reviewRequest);

  ctx.status = 201;
  ctx.body = savedReviewRequest;
};


const denyReviewRequest = async (ctx) => {
  const jwtUsername = ctx.state.user.username;

  await ReviewRequest.update({
    _id: ctx.params.id,
    expert: jwtUsername,
  }, { $set: { status: 'denied' } });

  ctx.status = 200;
};

export default {
  getReviewRequestsByExpert,
  getReviewRequestsByRequestor,
  createReviewRequest,
  denyReviewRequest
}