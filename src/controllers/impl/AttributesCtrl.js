import {APP_CMD} from '@deip/command-models';
import BaseController from './../base/BaseController';
import { BadRequestError } from './../../errors';
import {attributeCmdHandler} from './../../command-handlers';
import {AttributeDtoService} from './../../services';

const attributeDtoService = new AttributeDtoService();

class AttributesController extends BaseController {
  getAttributes = this.query({
    h: async (ctx) => {
      try {
        const attributes = await attributeDtoService.getAttributes();
        ctx.status = 200
        ctx.body = attributes;
      } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getAttributesByScope = this.query({
    h: async (ctx) => {
      try {
        const scope = ctx.params.scope;
        const attributes = await attributeDtoService.getAttributesByScope(scope);
        ctx.status = 200
        ctx.body = attributes;
      } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getNetworkAttributesByScope = this.query({
    h: async (ctx) => {
      try {
        const scope = ctx.params.scope;
        const attributes = await attributeDtoService.getNetworkAttributesByScope(scope);
        ctx.status = 200
        ctx.body = attributes;
      } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getAttribute = this.query({
    h: async (ctx) => {
      try {
        const attributeId = ctx.params.id;
        const attributes = await attributeDtoService.getAttribute(attributeId);
        ctx.status = 200
        ctx.body = attributes;
      } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getNetworkAttributes = this.query({
    h: async (ctx) => {
      try {
        const attributes = await attributeDtoService.getNetworkAttributes();
        ctx.status = 200
        ctx.body = attributes;
      } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getSystemAttributes = this.query({
    h: async (ctx) => {
      try {
        const attributes = await attributeDtoService.getSystemAttributes();
        ctx.status = 200
        ctx.body = attributes;
      } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  createAttribute = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_ATTRIBUTE);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };

        const msg = ctx.state.msg;

        await attributeCmdHandler.process(msg, ctx, validate);

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

  updateAttribute = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_ATTRIBUTE);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };

        const msg = ctx.state.msg;

        await attributeCmdHandler.process(msg, ctx, validate);

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

  deleteAttribute = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.DELETE_ATTRIBUTE);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };

        const msg = ctx.state.msg;

        await attributeCmdHandler.process(msg, ctx, validate);

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

const attributesCtrl = new AttributesController();

module.exports = attributesCtrl;