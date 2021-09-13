import { APP_CMD } from '@deip/constants';
import BaseController from '../base/BaseController';
import { BadRequestError, NotFoundError } from '../../errors';
import { reviewCmdHandler } from '../../command-handlers';
import { ReviewRequestDtoService, ReviewService } from '../../services';

const reviewRequestDtoService = new ReviewRequestDtoService();
const reviewService = new ReviewService();

class ReviewRequestsController extends BaseController {

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
}

const reviewRequestsCtrl = new ReviewRequestsController();

module.exports = reviewRequestsCtrl;