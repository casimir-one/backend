import deipRpc from '@deip/rpc-client';
import * as blockchainService from './../utils/blockchain';
import ReviewService from './../services/review';
import ReviewRequest from './../schemas/reviewRequest';
import userNotificationHandler from './../event-handlers/userNotificationHandler';
import ReviewCreatedEvent from './../events/reviewCreatedEvent';
import USER_NOTIFICATION_TYPE from '../constants/userNotificationType';


const createReview = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta } = ctx.request.body;

  try {
    const txResult = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    const reviewCreatedEvent = new ReviewCreatedEvent(datums, offchainMeta.review);
    ctx.state.events.push(reviewCreatedEvent);

    ctx.status = 200;
    ctx.body = [...ctx.state.events];

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }

  await next();
}


const getReview = async (ctx) => {
  const reviewExternalId = ctx.params.reviewExternalId;

  try {
    const reviewService = new ReviewService();
    const review = await reviewService.getReview(reviewExternalId);
    
    if (!review) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }

    ctx.status = 200;
    ctx.body = review;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getReviewsByResearch = async (ctx) => {
  const researchExternalId = ctx.params.researchExternalId;

  try {
    const reviewService = new ReviewService();
    const reviews = await reviewService.getReviewsByResearch(researchExternalId);
    ctx.status = 200;
    ctx.body = reviews;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getReviewsByResearchContent = async (ctx) => {
  const researchContentExternalId = ctx.params.researchContentExternalId;

  try {
    const reviewService = new ReviewService();
    const reviews = await reviewService.getReviewsByResearchContent(researchContentExternalId);
    ctx.status = 200;
    ctx.body = reviews;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getReviewsByAuthor = async (ctx) => {
  const author = ctx.params.author;

  try {
    const reviewService = new ReviewService();
    const reviews = await reviewService.getReviewsByAuthor(author);
    ctx.status = 200;
    ctx.body = reviews;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

export default {
  createReview,
  getReview,
  getReviewsByResearch,
  getReviewsByResearchContent,
  getReviewsByAuthor
}
