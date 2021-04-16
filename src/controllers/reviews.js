import * as blockchainService from './../utils/blockchain';
import ReviewService from './../services/review';
import ReviewCreatedEvent from './../events/legacy/reviewCreatedEvent';


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
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
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
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
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
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
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
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
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
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getReviewVotes = async (ctx) => {
  const reviewExternalId = ctx.params.reviewExternalId;
  try {
    const reviewService = new ReviewService();
    const reviews = await reviewService.getReviewVotes(reviewExternalId);
    ctx.status = 200;
    ctx.body = reviews;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

export default {
  createReview,
  getReview,
  getReviewsByResearch,
  getReviewsByResearchContent,
  getReviewsByAuthor,
  getReviewVotes
}
