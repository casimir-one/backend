import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { ReviewRequestCreatedEvent, ReviewRequestDeclinedEvent, ReviewCreatedEvent, UpvotedReviewEvent } from './../../events';

class ReviewCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const reviewCmdHandler = new ReviewCmdHandler();

reviewCmdHandler.register(APP_CMD.CREATE_REVIEW_REQUEST, (cmd, ctx) => {

  const reviewRequest = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ReviewRequestCreatedEvent({ ...reviewRequest, requestor: ctx.state.user.username }));
});

reviewCmdHandler.register(APP_CMD.DECLINE_REVIEW_REQUEST, (cmd, ctx) => {

  const reviewRequestData = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ReviewRequestDeclinedEvent(reviewRequestData));
});

reviewCmdHandler.register(APP_CMD.CREATE_REVIEW, (cmd, ctx) => {

  const review = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ReviewCreatedEvent(review));
});

reviewCmdHandler.register(APP_CMD.UPVOTE_REVIEW, (cmd, ctx) => {

  const review = cmd.getCmdPayload();

  ctx.state.appEvents.push(new UpvotedReviewEvent(review));
});

module.exports = reviewCmdHandler;