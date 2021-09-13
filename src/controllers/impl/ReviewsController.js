import { APP_CMD } from '@deip/constants';
import BaseController from '../base/BaseController';
import { BadRequestError } from '../../errors';
import { reviewCmdHandler } from '../../command-handlers';
import { ReviewDtoService } from '../../services';

const reviewDtoService = new ReviewDtoService();

class ReviewsController extends BaseController {

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
        ctx.status = 500;
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