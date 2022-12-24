import BaseController from '../base/BaseController';
import { LayoutDtoService, LayoutService } from '../../services';
import { APP_CMD } from '@casimir.one/platform-core';
import { NotFoundError, ConflictError } from '../../errors';
import { portalCmdHandler } from '../../command-handlers';
import qs from 'qs';

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
        const { filter = {}, sort, page, pageSize } = qs.parse(ctx.query);
        const { 
          paginationMeta, 
          result 
        } = await layoutDtoService.getLayoutsDTOsPaginated(filter, sort, { page, pageSize });
        ctx.successRes(result, { extraInfo: paginationMeta });
      } catch (err) {
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
          const createLayoutSettings = {
            cmdNum: APP_CMD.CREATE_LAYOUT
          };
          
          const validCmdsOrder = [createLayoutSettings];
          
          await this.validateCmds(appCmds, validCmdsOrder);
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
          const validateUpdateLayout = async (updateLayoutCmd, cmdStack) => {
            const { _id: layoutId } = updateLayoutCmd.getCmdPayload();
            const layout = await layoutService.getLayout(layoutId);
            if (!layout) {
              throw new NotFoundError(`Layout '${layoutId}' does not exist`);
            }
          };

          const updateLayoutSettings = {
            cmdNum: APP_CMD.UPDATE_LAYOUT,
            validate: validateUpdateLayout
          };
          
          const validCmdsOrder = [updateLayoutSettings];
          
          await this.validateCmds(appCmds, validCmdsOrder);
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
          const validateDeleteLayout = async (deleteLayoutCmd, cmdStack) => {
            const { layoutId } = deleteLayoutCmd.getCmdPayload();
            const layout = await layoutService.getLayout(layoutId);
            if (!layout) {
              throw new ConflictError(`Layout ${layoutId} is already deleted`);
            }
          };

          const deleteLayoutSettings = {
            cmdNum: APP_CMD.DELETE_LAYOUT,
            validate: validateDeleteLayout
          };
          
          const validCmdsOrder = [deleteLayoutSettings];
          
          await this.validateCmds(appCmds, validCmdsOrder);
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