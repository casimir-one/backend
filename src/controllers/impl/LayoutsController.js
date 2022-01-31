import BaseController from '../base/BaseController';
import { LayoutDtoService, LayoutService } from '../../services';
import { APP_CMD } from '@deip/constants';
import { BadRequestError, NotFoundError, ConflictError } from '../../errors';
import { portalCmdHandler } from '../../command-handlers';

const layoutDtoService = new LayoutDtoService();
const layoutService = new LayoutService();

class LayoutsController extends BaseController {
  getLayout = this.query({
    h: async (ctx) => {
      try {
        const layoutId = ctx.params.layoutId;
        const layout = await layoutDtoService.getLayout(layoutId);
        if (!layout) {
          throw new NotFoundError(`Layout '${layoutId}' does not exist`);
        }
        ctx.successRes(layout);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  getLayouts = this.query({
    h: async (ctx) => {
      try {
        const layouts = await layoutDtoService.getLayouts();
        ctx.successRes(layouts);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  getLayoutsByScope = this.query({
    h: async (ctx) => {
      try {
        const scope = ctx.params.scope;
        const layouts = await layoutDtoService.getLayoutsByScope(scope);
        ctx.successRes(layouts);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  createLayout = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_LAYOUT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };
        
        const msg = ctx.state.msg;
        await portalCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  updateLayout = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_LAYOUT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          const { _id: layoutId } = appCmd.getCmdPayload();
          const layout = await layoutService.getLayout(layoutId);
          if (!layout) {
            throw new NotFoundError(`Layout '${layoutId}' does not exist`);
          }
        };
        
        const msg = ctx.state.msg;
        await portalCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  deleteLayout = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.DELETE_LAYOUT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          const { layoutId } = appCmd.getCmdPayload();
          const layout = await layoutService.getLayout(layoutId);
          if (!layout) {
            throw new ConflictError(`Layout ${layoutId} is already deleted`);
          }
        };
        
        const msg = ctx.state.msg;
        await portalCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });
}

const layoutsCtrl = new LayoutsController();

module.exports = layoutsCtrl;