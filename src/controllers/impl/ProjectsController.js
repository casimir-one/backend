import qs from 'qs';
import { APP_CMD } from '@deip/constants';
import { RESEARCH_STATUS } from './../../constants';
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
        ctx.status = 200;
        ctx.body = project;

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  getDefaultProject = this.query({
    h: async (ctx) => {
      try {
        const accountId = ctx.params.accountId;
        const result = await projectDtoService.getDefaultProject(accountId);
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

  getPublicProjectsListing = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const filter = query.filter;
        const result = await projectDtoService.lookupProjects(filter);
        ctx.status = 200;
        ctx.body = result.filter(r => !r.isPrivate);
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }

    }
  });

  getUserProjectsListing = this.query({
    h: async (ctx) => {
      try {
        const jwtUsername = ctx.state.user.username;
        const member = ctx.params.username;
        const result = await projectDtoService.getProjectsForMember(member)
        ctx.status = 200;
        ctx.body = result.filter(r => !r.isPrivate || r.members.some(m => m == jwtUsername));
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }

    }
  });

  getTeamProjectsListing = this.query({
    h: async (ctx) => {
      try {
        const jwtUsername = ctx.state.user.username;
        const teamId = ctx.params.teamId;
        const result = await projectDtoService.getProjectsByTeam(teamId);
        ctx.status = 200;
        ctx.body = result.filter(r => !r.isPrivate || r.members.some(m => m == jwtUsername));
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }

    }
  });

  getTenantProjectsListing = this.query({
    h: async (ctx) => {
      try {
        const tenantId = ctx.state.tenant.id;
        const result = await projectDtoService.getProjectsByTenant(tenantId);
        ctx.status = 200;
        ctx.body = result.filter(r => !r.isPrivate);
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
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
          if (project.status === RESEARCH_STATUS.DELETED) {
            throw new ConflictError(`Project ${projectId} is already deleted`);
          }
        };

        const msg = ctx.state.msg;
        await projectCmdHandler.process(msg, ctx, validate);

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

  getProjectAttributeFile = this.query({
    h: async (ctx) => {
      try {
        const projectId = ctx.params.projectId;
        const attributeId = ctx.params.attributeId;
        const filename = ctx.params.filename;

        const isProjectRootFolder = projectId == attributeId;
        const filepath = isProjectRootFolder ? FileStorage.getResearchFilePath(projectId, filename) : FileStorage.getResearchAttributeFilePath(projectId, attributeId, filename);

        const fileExists = await FileStorage.exists(filepath);
        if (!fileExists) {
          throw new NotFoundError(`${filepath} is not found`);
        }

        const buff = await FileStorage.get(filepath);

        const imageQuery = ctx.query.image === 'true';
        if (imageQuery) {

          const width = ctx.query.width ? parseInt(ctx.query.width) : 1440;
          const height = ctx.query.height ? parseInt(ctx.query.height) : 430;
          const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
          const isRound = ctx.query.round ? ctx.query.round === 'true' : false;

          const resize = (w, h) => {
            return new Promise((resolve) => {
              sharp.cache(!noCache);
              sharp(buff)
                .rotate()
                .resize(w, h)
                .png()
                .toBuffer()
                .then(data => {
                  resolve(data)
                })
                .catch(err => {
                  resolve(err)
                });
            })
          }

          let image = await resize(width, height);
          if (isRound) {
            let round = (w) => {
              let r = w / 2;
              let circleShape = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);
              return new Promise((resolve, reject) => {
                image = sharp(image)
                  .overlayWith(circleShape, {
                    cutout: true
                  })
                  .png()
                  .toBuffer()
                  .then(data => {
                    resolve(data)
                  })
                  .catch(err => {
                    reject(err)
                  });
              });
            }

            image = await round(width);
          }

          ctx.type = 'image/png';
          ctx.status = 200;
          ctx.body = image;

        } else {

          const isDownload = ctx.query.download === 'true';

          const ext = filename.substr(filename.lastIndexOf('.') + 1);
          const name = filename.substr(0, filename.lastIndexOf('.'));
          const isImage = ['png', 'jpeg', 'jpg'].some(e => e == ext);
          const isPdf = ['pdf'].some(e => e == ext);

          if (isDownload) {
            ctx.response.set('Content-Disposition', `attachment; filename="${slug(name)}.${ext}"`);
            ctx.body = buff;
          } else if (isImage) {
            ctx.response.set('Content-Type', `image/${ext}`);
            ctx.response.set('Content-Disposition', `inline; filename="${slug(name)}.${ext}"`);
            ctx.body = buff;
          } else if (isPdf) {
            ctx.response.set('Content-Type', `application/${ext}`);
            ctx.response.set('Content-Disposition', `inline; filename="${slug(name)}.${ext}"`);
            ctx.body = buff;
          } else {
            ctx.response.set('Content-Disposition', `attachment; filename="${slug(name)}.${ext}"`);
            ctx.body = buff;
          }
        }

      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }

    }
  });
}

const projectsCtrl = new ProjectsController();

module.exports = projectsCtrl;