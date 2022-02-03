import qs from 'qs';
import { APP_CMD } from '@deip/constants';
import { PROJECT_STATUS } from './../../constants';
import BaseController from './../base/BaseController';
import { ProjectForm } from './../../forms';
import { BadRequestError, NotFoundError, ConflictError } from './../../errors';
import { projectCmdHandler } from './../../command-handlers';
import { ProjectDtoService, ProjectService } from './../../services';
import sharp from 'sharp'
import slug from 'limax';
import FileStorage from './../../storage';


const projectDtoService = new ProjectDtoService();
const projectService = new ProjectService();

class ProjectsController extends BaseController {
  getProject = this.query({
    h: async (ctx) => {
      try {
        const projectId = ctx.params.projectId;
        const project = await projectDtoService.getProject(projectId);
        if (!project) {
          throw new NotFoundError(`Project "${projectId}" id is not found`);
        }
        ctx.successRes(project);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getDefaultProject = this.query({
    h: async (ctx) => {
      try {
        const accountId = ctx.params.accountId;
        const result = await projectDtoService.getDefaultProject(accountId);
        ctx.successRes(result);
      } catch (err) {
        ctx.errorRes(err);
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
        ctx.successRes(result);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getPublicProjectsListing = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const filter = query.filter;
        const result = await projectDtoService.lookupProjects(filter);
        ctx.successRes(result.filter(r => !r.isPrivate));
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }

    }
  });

  getUserProjectsListing = this.query({
    h: async (ctx) => {
      try {
        const jwtUsername = ctx.state.user.username;
        const member = ctx.params.username;
        const result = await projectDtoService.getProjectsForMember(member)
        ctx.successRes(result.filter(r => !r.isPrivate || r.members.some(m => m == jwtUsername)));
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }

    }
  });

  getTeamProjectsListing = this.query({
    h: async (ctx) => {
      try {
        const jwtUsername = ctx.state.user.username;
        const teamId = ctx.params.teamId;
        const result = await projectDtoService.getProjectsByTeam(teamId);
        ctx.successRes(result.filter(r => !r.isPrivate || r.members.some(m => m == jwtUsername)));
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }

    }
  });

  getPortalProjectsListing = this.query({
    h: async (ctx) => {
      try {
        const portalId = ctx.state.portal.id;
        const result = await projectDtoService.getProjectsByPortal(portalId);
        ctx.successRes(result.filter(r => !r.isPrivate));
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  createProject = this.command({
    form: ProjectForm,
    h: async (ctx) => {
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

        const entityId = this.extractEntityId(msg, APP_CMD.CREATE_PROJECT);

        ctx.successRes({ _id: entityId });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  updateProject = this.command({
    form: ProjectForm,
    h: async (ctx) => {
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

        const entityId = this.extractEntityId(msg, APP_CMD.UPDATE_PROJECT);

        ctx.successRes({ _id: entityId });

      } catch (err) {
        ctx.errorRes(err);
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
          const {
            entityId: projectId
          } = appCmd.getCmdPayload();
          const project = await projectService.getProject(projectId);
          if (!project) {
            throw new NotFoundError(`Project ${projectId} is not found`);
          }
          if (project.status === PROJECT_STATUS.DELETED) {
            throw new ConflictError(`Project ${projectId} is already deleted`);
          }
        };

        const msg = ctx.state.msg;
        await projectCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });
}

const projectsCtrl = new ProjectsController();

module.exports = projectsCtrl;