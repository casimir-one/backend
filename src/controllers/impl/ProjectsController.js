import qs from 'qs';
import { APP_CMD } from '@deip/command-models';
import { RESEARCH_STATUS } from './../../constants';
import BaseController from './../base/BaseController';
import { ProjectForm } from './../../forms';
import { AppError, BadRequestError, NotFoundError, ConflictError } from './../../errors';
import { projectCmdHandler } from './../../command-handlers';
import { ProjectDtoService } from './../../services';


const projectDtoService = new ProjectDtoService();


class ProjectsController extends BaseController {


  getProject = this.query({
    h: async (ctx) => {
      try {

        const projectId = ctx.params.projectId;
        const result = await projectDtoService.getProject(projectId);
        ctx.status = 200;
        ctx.body = result;

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });


  getProjects = this.query({
    h: async (ctx) => {
      try {

        const query = qs.parse(ctx.query);
        const projectsIds = query.projectsIds;
        if (!Array.isArray(projectsIds)) {
          throw new BadRequestError(`projectsIds must be an array of ids`);
        }

        const result = await projectDtoService.getProjects(projectsIds);
        ctx.status = 200;
        ctx.body = result;

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });


  createProject = this.command({
    form: ProjectForm, h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_PROJECT || cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();
            if (!proposedCmds.some(cmd => cmd.getCmdNum() === APP_CMD.CREATE_PROJECT)) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.CREATE_PROJECT]} protocol cmd`);
            }
          }
        };

        const msg = ctx.state.msg;
        await projectCmdHandler.process(msg, ctx, validate);
        
        ctx.status = 200;
        ctx.body = { model: "ok" };
        
      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });


  updateProject = this.command({
    form: ProjectForm, h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_PROJECT || cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();
            if (!proposedCmds.some(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_PROJECT)) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.UPDATE_PROJECT]} protocol cmd`);
            }
          }
        };

        const msg = ctx.state.msg;
        await projectCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = { model: "ok" };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });


  deleteProject = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.DELETE_PROJECT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts app cmd`);
          }
          const { entityId: projectId } = appCmd.getCmdPayload();
          const projectView = await projectDtoService.getProjectView(projectId);
          if (!projectView) {
            throw new NotFoundError(`Project ${projectId} is not found`);
          }
          if (projectView.status === RESEARCH_STATUS.DELETED) {
            throw new ConflictError(`Project ${projectId} is already deleted`);
          }
        };

        const msg = ctx.state.msg;
        await projectCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = { model: "ok" };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });


}


const projectsCtrl = new ProjectsController();


module.exports = projectsCtrl;