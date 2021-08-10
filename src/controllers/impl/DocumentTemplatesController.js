import { APP_CMD } from '@deip/constants';
import BaseController from '../base/BaseController';
import { BadRequestError, ForbiddenError } from '../../errors';
import { documentTemplateCmdHandler } from '../../command-handlers';
import { DocumentTemplateDtoService, TeamDtoService } from '../../services';

const documentTemplateDtoService = new DocumentTemplateDtoService();
const teamDtoService = new TeamDtoService();

class DocumentTemplatesController extends BaseController {
  getDocumentTemplate = this.query({
    h: async (ctx) => {
      try {
        const documentTemplateId = ctx.params.documentTemplateId;
        const documentTemplate = await documentTemplateDtoService.getDocumentTemplate(documentTemplateId);
        ctx.status = 200
        ctx.body = documentTemplate;
      } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getDocumentTemplatesByAccount = this.query({
    h: async (ctx) => {
      try {
        const account = ctx.params.account;
        const documentTemplates = await documentTemplateDtoService.getDocumentTemplatesByAccount(account);
        ctx.status = 200
        ctx.body = documentTemplates;
      } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  createDocumentTemplate = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_DOCUMENT_TEMPLATE);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };

        const msg = ctx.state.msg;

        await documentTemplateCmdHandler.process(msg, ctx, validate);

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

  updateDocumentTemplate = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_DOCUMENT_TEMPLATE);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          const { account } = appCmd.getCmdPayload();
          const username = ctx.state.user.username;
          if (account !== username) {
            const isMember = await teamDtoService.authorizeTeamAccount(account, username);
            if (!isMember) {
              throw new ForbiddenError(`You have no permission to edit this document`);
            }
          }
        };

        const msg = ctx.state.msg;

        await documentTemplateCmdHandler.process(msg, ctx, validate);

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

  deleteDocumentTemplate = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.DELETE_DOCUMENT_TEMPLATE);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          const { documentTemplateId } = appCmd.getCmdPayload();
          const documentTemplate = await documentTemplateDtoService.getDocumentTemplate(documentTemplateId);
          if (!documentTemplate) {
            throw new ConflictError(`DocumentTemplate ${documentTemplateId} is already deleted`);
          }
          const username = ctx.state.user.username;
          const { account } = documentTemplate;
          if (account !== username) {
            const isMember = await teamDtoService.authorizeTeamAccount(account, username);
            if (!isMember) {
              throw new ForbiddenError(`You have no permission to delete this document`);
            }
          }
        };

        const msg = ctx.state.msg;

        await documentTemplateCmdHandler.process(msg, ctx, validate);

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

const documentTemplatesCtrl = new DocumentTemplatesController();

module.exports = documentTemplatesCtrl;