import { APP_CMD } from '@deip/constants';
import BaseController from '../base/BaseController';
import { BadRequestError, NotFoundError } from '../../errors';
import { projectNdaCmdHandler } from '../../command-handlers';
import { ProjectNdaDtoService } from '../../services';

const projectNdaDtoService = new ProjectNdaDtoService();

class ProjectNdaController extends BaseController {

  getProjectNonDisclosureAgreement = this.query({
    h: async (ctx) => {
      try {
        const ndaId = ctx.params.ndaId;
        const result = await projectNdaDtoService.getProjectNda(ndaId);
        if (!result) {
          throw new NotFoundError(`ProjectNda "${ndaId}" id is not found`);
        }
        ctx.body = result;
        ctx.status = 200;
      }
      catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getProjectNonDisclosureAgreementsByCreator = this.query({
    h: async (ctx) => {
      try {
        const creator = ctx.params.username;
        const result = await projectNdaDtoService.getProjectNdaListByCreator(creator);
        ctx.body = result;
        ctx.status = 200;
      }
      catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getProjectNonDisclosureAgreementsByHash = this.query({
    h: async (ctx) => {
      try {
        const hash = ctx.params.hash;
        const result = await projectNdaDtoService.getProjectNdaListByHash(hash);
        ctx.body = result;
        ctx.status = 200;
      }
      catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  getProjectNonDisclosureAgreementsByProject = this.query({
    h: async (ctx) => {
      try {
        const projectId = ctx.params.projectId;
        const result = await projectNdaDtoService.getProjectNdaListByProject(projectId);
        ctx.body = result;
        ctx.status = 200;
      }
      catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }
    }
  });

  createProjectNonDisclosureAgreement = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          const proposedCmds = appCmd.getProposedCmds();
          if (!proposedCmds.some(cmd => cmd.getCmdNum() === APP_CMD.CREATE_PROJECT_NDA)) {
            throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.CREATE_PROJECT_NDA]} protocol cmd`);
          }
        };

        const msg = ctx.state.msg;

        await projectNdaCmdHandler.process(msg, ctx, validate);

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

const projectNdaCtrl = new ProjectNdaController();

module.exports = projectNdaCtrl;