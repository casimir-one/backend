import { APP_CMD } from '@deip/constants';
import BaseController from '../base/BaseController';
import { BadRequestError, NotFoundError } from '../../errors';
import { reviewCmdHandler } from '../../command-handlers';
import { ReviewDtoService, ReviewRequestDtoService, ReviewService } from '../../services';

const reviewRequestDtoService = new ReviewRequestDtoService();
const reviewService = new ReviewService();
const reviewDtoService = new ReviewDtoService();

class ReviewsController extends BaseController {

  getReviewRequestsByExpert = this.query({
    h: async (ctx) => {
      try {
        const jwtUsername = ctx.state.user.username;
        const expert = ctx.params.username;
        const status = ctx.query.status;

        if (expert !== jwtUsername) {
          ctx.status = 200;
          ctx.body = [];
          return;
        }
    
        const reviewRequests = await reviewRequestDtoService.getReviewRequestsByExpert(expert, status);
        ctx.status = 200;
        ctx.body = reviewRequests;
    
      } catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
      }
    }
  });

  getReviewRequestsByRequestor = this.query({
    h: async (ctx) => {
      
      try {
        const jwtUsername = ctx.state.user.username;
        const requestor = ctx.params.username;
        const status = ctx.query.status;
        if (requestor !== jwtUsername) {
          ctx.status = 200;
          ctx.body = [];
          return;
        }
    
        const reviewRequests = await reviewRequestDtoService.getReviewRequestsByRequestor(requestor, status);
        ctx.status = 200;
        ctx.body = reviewRequests;
    
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
      }
    }
  });

  createReviewRequest = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_REVIEW_REQUEST);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }

          const { expert, projectContentId } = appCmd.getCmdPayload();
          const username = ctx.state.user.username;

          if (expert === username) {
            throw new BadRequestError(`You can't request review from yourself`);
          }

          const existingRequest = await reviewRequestDtoService.getReviewRequestsByExpertAndProjectContent(expert, projectContentId)
          if (existingRequest) {
            throw new BadRequestError(`Review with such params already requested`);
          }

          const projectContentReviews = await reviewService.getReviewsByProjectContent(projectContentId);
          const existingReview = projectContentReviews.find(r => r.author === expert);
          if (existingReview) {
            throw new BadRequestError(`Expert already reviewed this content`);
          }
        };

        const msg = ctx.state.msg;

        await reviewCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = {
          model: "ok"
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  denyReviewRequest = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.DECLINE_REVIEW_REQUEST);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }

          const { reviewRequestId } = appCmd.getCmdPayload();
          const username = ctx.state.user.username;

          const reviewRequests = await reviewRequestDtoService.getReviewRequestsByExpert(username);
          if (!reviewRequests.some(r => r._id == reviewRequestId)) {
            throw new NotFoundError(`Review request ${reviewRequestId} for expert ${username} is not found`);
          }
        };

        const msg = ctx.state.msg;

        await reviewCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = {
          model: "ok"
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  getReview = this.query({
    h: async (ctx) => {
      try {
        const reviewId = ctx.params.reviewId;
        const review = await reviewDtoService.getReview(reviewId);
        
        if (!review) {
          throw new NotFoundError(`Review "${reviewId}" id is not found`);
        }
    
        ctx.status = 200;
        ctx.body = review;
    
      } catch (err) {
        console.error(err);
        ctx.status = err.httpStatus || 500;
        ctx.body = err;
      }
    }
  });

  getReviewsByProject = this.query({
    h: async (ctx) => {
      try {
        const projectId = ctx.params.projectId;
        const reviews = await reviewDtoService.getReviewsByProject(projectId);
        ctx.status = 200;
        ctx.body = reviews;
    
      } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getReviewsByProjectContent = this.query({
    h: async (ctx) => {
      try {
        const projectContentId = ctx.params.projectContentId;
        const reviews = await reviewDtoService.getReviewsByProjectContent(projectContentId);
        ctx.status = 200;
        ctx.body = reviews;
    
      } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getReviewsByAuthor = this.query({
    h: async (ctx) => {
      try {
        const author = ctx.params.author;
        const reviews = await reviewDtoService.getReviewsByAuthor(author);
        ctx.status = 200;
        ctx.body = reviews;
      } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getReviewUpvotes = this.query({
    h: async (ctx) => {
      try {
        const reviewId = ctx.params.reviewId;
        const reviews = await reviewDtoService.getReviewUpvotes(reviewId);
        ctx.status = 200;
        ctx.body = reviews;
      } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  createReview = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_REVIEW);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };

        const msg = ctx.state.msg;

        await reviewCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = {
          model: "ok"
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  upvoteReview = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPVOTE_REVIEW);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };

        const msg = ctx.state.msg;

        await reviewCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = {
          model: "ok"
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });
}

const reviewsCtrl = new ReviewsController();

module.exports = reviewsCtrl;