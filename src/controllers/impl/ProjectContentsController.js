import { APP_CMD } from '@deip/constants';
import BaseController from '../base/BaseController';
import { ProjectContentPackageForm } from '../../forms';
import { BadRequestError, NotFoundError, ConflictError, ForbiddenError } from '../../errors';
import { projectContentCmdHandler } from '../../command-handlers';
import { ProjectDtoService, ProjectContentService, ProjectContentDtoService, ProjectService, TeamDtoService, DraftService } from './../../services';
import FileStorage from './../../storage';
import readArchive from './../../dar/readArchive';
import { PROJECT_CONTENT_STATUS } from '@deip/constants';
import mongoose from 'mongoose';

const projectDtoService = new ProjectDtoService();
const projectService = new ProjectService();
const projectContentDtoService = new ProjectContentDtoService();
const projectContentService = new ProjectContentService();
const teamDtoService = new TeamDtoService();
const draftService = new DraftService();

class ProjectContentsController extends BaseController {

  getProjectContent = this.query({
    h: async (ctx) => {
      try {
        const projectContentId = ctx.params.projectContentId;
        const projectContent = await projectContentDtoService.getProjectContent(projectContentId);
        if (!projectContent) {
          throw new NotFoundError(`ProjectContent "${projectContentId}" is not found`);
        }
        ctx.status = 200;
        ctx.body = projectContent;
      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err;
      }
    }
  });

  getProjectContentsByProject = this.query({
    h: async (ctx) => {
      try {
        const projectId = ctx.params.projectId;
        const project = await projectService.getProject(projectId);
        if (!project) {
          throw new NotFoundError(`Project "${projectId}" is not found`);
        }

        const projectContents = await projectContentDtoService.getProjectContentsByProject(projectId);

        const result = projectContents.map(pc => ({ ...pc, isDraft: false }))

        ctx.status = 200;
        ctx.body = result;
      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err;
      }
    }
  });

  getProjectContentsByTenant = this.query({
    h: async (ctx) => {
      try {
        const portalId = ctx.params.portalId;
        const result = await projectContentDtoService.getProjectContentsByTenant(portalId)
        ctx.status = 200;
        ctx.body = result;
      } catch (err) {
        console.log(err);
        ctx.status = err.httpStatus || 500;
        ctx.body = err;
      }
    }
  });

  getPublicProjectContentListing = this.query({
    h: async (ctx) => {
      try {
        const projectContents = await projectContentDtoService.lookupProjectContents();
        const projectIds = projectContents.reduce((acc, projectContent) => {
          if (!acc.some(projectId => projectId == projectContent.research_external_id)) {
            acc.push(projectContent.research_external_id);
          }
          return acc;
        }, []);

        const projects = await projectDtoService.getProjects(projectIds);
        const publicProjectsIds = projects.filter(r => !r.isPrivate).map(r => r.external_id);
        const result = projectContents.filter(projectContent => publicProjectsIds.some(id => id == projectContent.research_external_id))

        ctx.status = 200;
        ctx.body = result;
      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err;
      }
    }
  });

  getProjectContentDarArchiveStaticFiles = this.query({
    h: async (ctx) => {
      try {
        const projectContentId = ctx.params.projectContentId;
        const filename = ctx.params.file;
        const rc = await projectContentDtoService.getProjectContentRef(projectContentId);
        const filepath = FileStorage.getResearchDarArchiveFilePath(rc.researchExternalId, rc.folder, filename);

        const buff = await FileStorage.get(filepath);
        const ext = filename.substr(filename.lastIndexOf('.') + 1);
        const name = filename.substr(0, filename.lastIndexOf('.'));
        const isImage = ['png', 'jpeg', 'jpg'].some(e => e == ext);
        const isPdf = ['pdf'].some(e => e == ext);

        if (isImage) {
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

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err;
      }
    }
  });

  getProjectContentRef = this.query({
    h: async (ctx) => {
      try {
        const refId = ctx.params.refId;
        const projectContentRef = await projectContentDtoService.getProjectContentRef(refId);
        ctx.status = 200;
        ctx.body = projectContentRef;
      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err;
      }
    }
  });

  getProjectContentReferencesGraph = this.query({
    h: async (ctx) => {
      try {
        const contentId = ctx.params.contentId;
        const graph = await projectContentDtoService.getProjectContentReferencesGraph(contentId);
        ctx.status = 200;
        ctx.body = graph;
      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err;
      }
    }
  });

  getProjectContentPackageFile = this.query({
    h: async (ctx) => {
      try {
        const projectContentId = ctx.params.projectContentId;
        const fileHash = ctx.params.fileHash;
        const isDownload = ctx.query.download === 'true';

        const projectContentRef = await projectContentDtoService.getProjectContentRef(projectContentId);
        if (!projectContentRef) {
          throw new NotFoundError(`Package "${projectContentId}" is not found`);
        }

        const project = await projectDtoService.getProject(projectContentRef.researchExternalId);
        if (project.isPrivate) {
          const jwtUsername = ctx.state.user.username;
          const isAuthorized = await teamDtoService.authorizeTeamAccount(project.research_group.external_id, jwtUsername)
          if (!isAuthorized) {
            throw new ForbiddenError(`"${jwtUsername}" is not permitted to get "${project.external_id}" research content`);
          }
        }

        const file = projectContentRef.packageFiles.find(f => f.hash == fileHash);
        if (!file) {
          throw new NotFoundError(`File "${fileHash}" is not found`);
        }

        const filename = file.filename;
        const filepath = FileStorage.getResearchContentPackageFilePath(projectContentRef.researchExternalId, projectContentRef.hash, filename);
        const ext = filename.substr(filename.lastIndexOf('.') + 1);
        const name = filename.substr(0, filename.lastIndexOf('.'));
        const isImage = ['png', 'jpeg', 'jpg'].some(e => e == ext);
        const isPdf = ['pdf'].some(e => e == ext);

        if (isDownload) {
          ctx.response.set('content-disposition', `attachment; filename="${slug(name)}.${ext}"`);
        } else if (isImage) {
          ctx.response.set('content-type', `image/${ext}`);
          ctx.response.set('content-disposition', `inline; filename="${slug(name)}.${ext}"`);
        } else if (isPdf) {
          ctx.response.set('content-type', `application/${ext}`);
          ctx.response.set('content-disposition', `inline; filename="${slug(name)}.${ext}"`);
        } else {
          ctx.response.set('content-disposition', `attachment; filename="${slug(name)}.${ext}"`);
        }

        const fileExists = await FileStorage.exists(filepath);
        if (!fileExists) {
          throw new NotFoundError(`${filepath} is not found`);
        }

        const buff = await FileStorage.get(filepath);
        ctx.body = buff;
      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  getProjectContentDar = this.query({
    h: async (ctx) => {
      try {
        const projectContentId = ctx.params.projectContentId;
        const authorization = ctx.request.header['authorization'];
        const jwt = authorization.substring(authorization.indexOf("Bearer ") + "Bearer ".length, authorization.length);

        const dirPathData = {};
        const projectContent = await projectContentDtoService.getProjectContentRef(projectContentId);

        if (!projectContent) {
          const draft = await draftService.getDraft(projectContentId);
          if (!draft) {
            throw new NotFoundError(`Dar for "${projectContentId}" id is not found`);
          }
          dirPathData.projectId = draft.projectId
          dirPathData.folder = draft.folder
        } else {
          dirPathData.projectId = projectContent.researchExternalId
          dirPathData.folder = projectContent.folder
        }

        const archiveDir = FileStorage.getResearchDarArchiveDirPath(dirPathData.projectId, dirPathData.folder);
        const exists = await FileStorage.exists(archiveDir);

        if (!exists) {
          throw new NotFoundError(`Dar "${archiveDir}" is not found`);
        }

        const opts = {}
        const rawArchive = await readArchive(archiveDir, {
          noBinaryContent: true,
          ignoreDotFiles: true,
          versioning: opts.versioning
        })
        Object.keys(rawArchive.resources).forEach(recordPath => {
          const record = rawArchive.resources[recordPath]
          if (record._binary) {
            delete record._binary
            record.encoding = 'url'
            record.data = `${config.DEIP_SERVER_URL}/api/research-content/texture/${projectContentId}/assets/${record.path}?authorization=${jwt}`;
          }
        })
        ctx.status = 200;
        ctx.body = rawArchive;
      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  getDraftsByProject = this.query({
    h: async (ctx) => {
      try {

        const projectId = ctx.params.projectId;
        const result = await draftService.getDraftsByProject(projectId);
        ctx.status = 200;
        ctx.body = result;

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  getDraft = this.query({
    h: async (ctx) => {
      try {

        const draftId = ctx.params.draftId;
        const result = await draftService.getDraft(draftId);
        ctx.status = 200;
        ctx.body = result;

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  unlockDraft = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_DRAFT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };

        const msg = ctx.state.msg;

        await projectContentCmdHandler.process(msg, ctx, validate);

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

  createProjectContent = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_PROJECT_CONTENT || cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();
            const createProjectContentCmd = proposedCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_PROJECT_CONTENT);

            if (!createProjectContentCmd) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.CREATE_PROJECT_CONTENT]} protocol cmd`);
            } else {
              const draftId = createProjectContentCmd.getCmdPayload().content;

              const draft = await draftService.getDraft(draftId);

              if(!draft) {
                throw new NotFoundError(`Draft for "${draftId}" id is not found`);
              }
              if(draft.status != PROJECT_CONTENT_STATUS.IN_PROGRESS) {
                throw new BadRequestError(`Research content "${draft.projectId}" is in '${draft.status}' status`);
              }
            }
          } else if (cmd.getCmdNum() === APP_CMD.CREATE_PROJECT_CONTENT) {
            const draftId = appCmd.getCmdPayload().content;
            const draft = await draftService.getDraft(draftId);
            if(!draft) {
              throw new NotFoundError(`Draft for "${draftId}" id is not found`);
            }
            if(draft.status != PROJECT_CONTENT_STATUS.IN_PROGRESS) {
              throw new BadRequestError(`Research content "${draft.projectId}" is in '${draft.status}' status`);
            }
          }
        };

        const msg = ctx.state.msg;
        await projectContentCmdHandler.process(msg, ctx, validate);

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

  createDraft = this.command({
    form: ProjectContentPackageForm, h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_DRAFT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };

        const msg = ctx.state.msg;

        await projectContentCmdHandler.process(msg, ctx, validate);

        const appCmd = msg.appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_DRAFT);
        const draftId = mongoose.Types.ObjectId(appCmd.getCmdPayload().draftId);

        ctx.status = 200;
        ctx.body = {
          _id: draftId
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  updateDraft = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_DRAFT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }

          const { _id: draftId } = appCmd.getCmdPayload();

          const draft = await draftService.getDraft(draftId);

          if (!draft) {
            throw new NotFoundError(`Draft for "${draftId}" id is not found`);
          }
          if (draft.status != PROJECT_CONTENT_STATUS.IN_PROGRESS) {
            throw new BadRequestError(`Draft "${draftId}" is locked for updates`);
          }
      
          const username = ctx.state.user.username;
          const isAuthorized = await teamDtoService.authorizeTeamAccount(draft.teamId, username)
          if (!isAuthorized) {
            throw new ForbiddenError(`"${username}" is not permitted to edit "${projectId}" project`);
          }

          if (draft.status == PROJECT_CONTENT_STATUS.PROPOSED) {
            throw new ConflictError(`Content with hash ${draft.hash} has been proposed already and cannot be deleted`);
          }
      
          const archiveDir = FileStorage.getResearchDarArchiveDirPath(draft.projectId, draft.folder);
          const exists = await FileStorage.exists(archiveDir);
          if (!exists) {
            throw new NotFoundError(`Dar "${archiveDir}" is not found`);
          }
        };

        const msg = ctx.state.msg;

        await projectContentCmdHandler.process(msg, ctx, validate);

        const appCmd = msg.appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_DRAFT);
        const draftId = appCmd.getCmdPayload()._id;

        ctx.status = 200;
        ctx.body = {
          _id: draftId
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err;
      }
    }
  });

  deleteDraft = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.DELETE_DRAFT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts app cmd`);
          }

          const { draftId } = appCmd.getCmdPayload();
          const draft = await draftService.getDraft(draftId);
          if (!draft) {
            throw new NotFoundError(`Draft for "${draftId}" id is not found`);
          }

          const username = ctx.state.user.username;
          const isAuthorized = await teamDtoService.authorizeTeamAccount(draft.teamId, username)
          if (!isAuthorized) {
            throw new ForbiddenError(`"${username}" is not permitted to edit "${projectId}" project`);
          }

          // if there is a proposal for this content (no matter is it approved or still in voting progress)
          // we must respond with an error as blockchain hashed data should not be modified
          if (draft.status == PROJECT_CONTENT_STATUS.PROPOSED) {
            throw new ConflictError(`Content with hash ${draft.hash} has been proposed already and cannot be deleted`);
          }

        };

        const msg = ctx.state.msg;
        await projectContentCmdHandler.process(msg, ctx, validate);

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

  uploadProjectContentPackage = this.command({
    form: ProjectContentPackageForm, h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_DRAFT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };


        const msg = ctx.state.msg;

        await projectContentCmdHandler.process(msg, ctx, validate);

        const appCmd = msg.appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_DRAFT);
        const draftId = appCmd.getCmdPayload().draftId;

        ctx.status = 200;
        ctx.body = {
          _id: draftId
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err;
      }
    }
  });

}

const projectContentsCtrl = new ProjectContentsController();

module.exports = projectContentsCtrl;