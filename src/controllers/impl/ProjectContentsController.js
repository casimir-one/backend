import { APP_CMD, PROJECT_CONTENT_FORMAT, PROJECT_CONTENT_STATUS, PROJECT_CONTENT_DRAFT_STATUS } from '@deip/constants';
import slug from 'limax';
import mongoose from 'mongoose';
import qs from "qs";
import { projectContentCmdHandler } from '../../command-handlers';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from '../../errors';
import { ProjectContentPackageForm } from '../../forms';
import {
  DraftService, ProjectContentDtoService, ProjectDtoService, ProjectService,
  TeamDtoService
} from '../../services';
import BaseController from '../base/BaseController';
import readArchive from './../../dar/readArchive';
import FileStorage from './../../storage';

const projectDtoService = new ProjectDtoService();
const projectService = new ProjectService();
const projectContentDtoService = new ProjectContentDtoService();
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
        ctx.successRes(projectContent);
      } catch (err) {
        ctx.errorRes(err);
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

        ctx.successRes(result);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getProjectContentsByPortal = this.query({
    h: async (ctx) => {
      try {
        const portalId = ctx.params.portalId;
        const result = await projectContentDtoService.getProjectContentsByPortal(portalId)
        ctx.successRes(result);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  getPublicProjectContentListing = this.query({
    h: async (ctx) => {
      try {
        const projectContents = await projectContentDtoService.lookupProjectContents();
        const projectIds = projectContents.reduce((acc, projectContent) => {
          if (!acc.some(projectId => projectId == projectContent.projectId)) {
            acc.push(projectContent.projectId);
          }
          return acc;
        }, []);

        const projects = await projectDtoService.getProjects(projectIds);
        const publicProjectsIds = projects.filter(r => !r.isPrivate).map(r => r._id);
        const result = projectContents.filter(projectContent => publicProjectsIds.some(id => id == projectContent.projectId))

        ctx.successRes(result);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getPublicProjectContentListingPaginated = this.query({
    h: async (ctx) => {
      try {
        const { filter = {}, sort, page, pageSize } = qs.parse(ctx.query);
        const {
          paginationMeta,
          result: projectContents
        } = await projectContentDtoService.lookupProjectContentsWithPagination(filter, sort, { page, pageSize });

        const onlyUniq = (value, index, self) => self.indexOf(value) === index;
        const projectIds = projectContents.map(x => x.projectId).filter(onlyUniq)

        const projects = await projectDtoService.getProjects(projectIds);
        const publicProjectsIds = projects.filter(r => !r.isPrivate).map(r => r._id);

        const result = projectContents.filter(content => publicProjectsIds.includes(content.projectId))

        ctx.successRes(result, { extraInfo: paginationMeta });
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getProjectContentDarArchiveStaticFiles = this.query({
    h: async (ctx) => {
      try {
        const projectContentId = ctx.params.projectContentId;
        const filename = ctx.params.file;
        const projectContent = await projectContentDtoService.getProjectContentRef(projectContentId);
        const filepath = FileStorage.getProjectDarArchiveFilePath(projectContent.projectId, projectContent.folder, filename);

        const buff = await FileStorage.get(filepath);
        const ext = filename.substr(filename.lastIndexOf('.') + 1);
        const name = filename.substr(0, filename.lastIndexOf('.'));
        const isImage = ['png', 'jpeg', 'jpg'].some(e => e == ext);
        const isPdf = ['pdf'].some(e => e == ext);

        if (isImage) {
          ctx.response.set('Content-Type', `image/${ext}`);
          ctx.response.set('Content-Disposition', `inline; filename="${slug(name)}.${ext}"`);
          ctx.successRes(buff, { withoutWrap: true });
        } else if (isPdf) {
          ctx.response.set('Content-Type', `application/${ext}`);
          ctx.response.set('Content-Disposition', `inline; filename="${slug(name)}.${ext}"`);
          ctx.successRes(buff, { withoutWrap: true });
        } else {
          ctx.response.set('Content-Disposition', `attachment; filename="${slug(name)}.${ext}"`);
          ctx.successRes(buff, { withoutWrap: true });
        }

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getProjectContentRef = this.query({
    h: async (ctx) => {
      try {
        const refId = ctx.params.refId;
        const projectContentRef = await projectContentDtoService.getProjectContentRef(refId);
        ctx.successRes(projectContentRef);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getProjectContentReferencesGraph = this.query({
    h: async (ctx) => {
      try {
        const contentId = ctx.params.contentId;
        const graph = await projectContentDtoService.getProjectContentReferencesGraph(contentId);
        ctx.successRes(graph);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getProjectContentPackageFile = this.query({
    h: async (ctx) => {
      try {
        const projectContentId = ctx.params.projectContentId;
        const fileHash = ctx.params.fileHash;
        const isDownload = ctx.query.download === 'true';

        const dirPathData = {
          projectId: '',
          packageFiles: '',
          folder: ''
        };

        const projectContentRef = await projectContentDtoService.getProjectContentRef(projectContentId);
        if (!projectContentRef) {
          const draft = await draftService.getDraft(projectContentId);
          if (!draft) {
            throw new NotFoundError(`Package for "${projectContentId}" id is not found`);
          }
          dirPathData.projectId = draft.projectId
          dirPathData.folder = draft.folder
          dirPathData.packageFiles = draft.packageFiles
        } else {
          dirPathData.projectId = projectContentRef.projectId
          dirPathData.folder = projectContentRef.folder
          dirPathData.packageFiles = projectContentRef.packageFiles
        }

        const project = await projectDtoService.getProject(dirPathData.projectId);
        if (project.isPrivate) {
          const jwtUsername = ctx.state.user.username;
          const isAuthorized = await teamDtoService.authorizeTeamAccount(project.teamId, jwtUsername)
          if (!isAuthorized) {
            throw new ForbiddenError(`"${jwtUsername}" is not permitted to get "${project._id}" project content`);
          }
        }

        const file = dirPathData.packageFiles.find(f => f.hash == fileHash);
        if (!file) {
          throw new NotFoundError(`File "${fileHash}" is not found`);
        }

        const filename = file.filename;
        const filepath = FileStorage.getProjectContentPackageFilePath(dirPathData.projectId, dirPathData.folder, filename);
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
        ctx.successRes(buff, { withoutWrap: true });
      } catch (err) {
        ctx.errorRes(err);
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
          dirPathData.projectId = projectContent.projectId
          dirPathData.folder = projectContent.folder
        }

        const archiveDir = FileStorage.getProjectDarArchiveDirPath(dirPathData.projectId, dirPathData.folder);
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
            record.data = `${config.DEIP_SERVER_URL}/api/v2/project-content/texture/${projectContentId}/assets/${record.path}?authorization=${jwt}`;
          }
        })
        ctx.successRes(rawArchive, { withoutWrap: true });
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getDraftsByProject = this.query({
    h: async (ctx) => {
      try {

        const projectId = ctx.params.projectId;
        const result = await draftService.getDraftsByProject(projectId);
        ctx.successRes(result);

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getDraft = this.query({
    h: async (ctx) => {
      try {

        const draftId = ctx.params.draftId;
        const result = await draftService.getDraft(draftId);
        ctx.successRes(result);

      } catch (err) {
        ctx.errorRes(err);
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

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
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
              const draftHash = createProjectContentCmd.getCmdPayload().content;
              const draft = await draftService.getDraftByHash(draftHash);
              if (!draft) {
                throw new NotFoundError(`Draft for "${draftHash}" hash is not found`);
              }
              const projectContent = await projectContentDtoService.findProjectContentRefByHash(draft.projectId, draftHash);

              if (projectContent) {
                throw new ConflictError(`Project content with "${draftHash}" hash already exist`);
              }
              if (draft.status != PROJECT_CONTENT_DRAFT_STATUS.IN_PROGRESS) {
                throw new BadRequestError(`Project content "${draft.projectId}" is in '${draft.status}' status`);
              }
            }
          } else if (appCmd.getCmdNum() === APP_CMD.CREATE_PROJECT_CONTENT) {
            const draftHash = appCmd.getCmdPayload().content;
            const draft = await draftService.getDraftByHash(draftHash);

            if (!draft) {
              throw new NotFoundError(`Draft for "${draftHash}" hash is not found`);
            }
            const projectContent = await projectContentDtoService.findProjectContentRefByHash(draft.projectId, draftHash);

            if (projectContent) {
              throw new ConflictError(`Project content with "${draftHash}" hash already exist`);
            }
            if (draft.status != PROJECT_CONTENT_DRAFT_STATUS.IN_PROGRESS) {
              throw new BadRequestError(`Project content "${draft.projectId}" is in '${draft.status}' status`);
            }
          }
        };

        const msg = ctx.state.msg;
        await projectContentCmdHandler.process(msg, ctx, validate);
        const entityId = this.extractEntityId(msg, APP_CMD.CREATE_PROJECT_CONTENT);
        ctx.successRes({ _id: entityId });

      } catch (err) {
        ctx.errorRes(err);
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

        ctx.successRes({
          _id: draftId
        });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  updateDraft = this.command({
    form: ProjectContentPackageForm, h: async (ctx) => {
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
          if (draft.status != PROJECT_CONTENT_DRAFT_STATUS.IN_PROGRESS) {
            throw new BadRequestError(`Draft "${draftId}" is locked for updates`);
          }

          const username = ctx.state.user.username;
          const isAuthorized = await teamDtoService.authorizeTeamAccount(draft.teamId, username)
          if (!isAuthorized) {
            throw new ForbiddenError(`"${username}" is not permitted to edit "${projectId}" project`);
          }

          if (draft.status == PROJECT_CONTENT_DRAFT_STATUS.PROPOSED) {
            throw new ConflictError(`Content with hash ${draft.hash} has been proposed already and cannot be deleted`);
          }

          if (draft.formatType === PROJECT_CONTENT_FORMAT.DAR || draft.formatType === PROJECT_CONTENT_FORMAT.PACKAGE) {
            const archiveDir = FileStorage.getProjectDarArchiveDirPath(draft.projectId, draft.folder);
            const exists = await FileStorage.exists(archiveDir);
            if (!exists) {
              throw new NotFoundError(`Dar "${archiveDir}" is not found`);
            }
          }
        };

        const msg = ctx.state.msg;

        await projectContentCmdHandler.process(msg, ctx, validate);

        const appCmd = msg.appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_DRAFT);
        const draftId = appCmd.getCmdPayload()._id;

        ctx.successRes({
          _id: draftId
        });

      } catch (err) {
        ctx.errorRes(err);
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
          if (draft.status == PROJECT_CONTENT_DRAFT_STATUS.PROPOSED) {
            throw new ConflictError(`Content with hash ${draft.hash} has been proposed already and cannot be deleted`);
          }

        };

        const msg = ctx.state.msg;
        await projectContentCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
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

        ctx.successRes({
          _id: draftId
        });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  udpateProjectContent = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd =>
            cmd.getCmdNum() === APP_CMD.UPDATE_PROJECT_CONTENT_STATUS ||
            cmd.getCmdNum() === APP_CMD.UPDATE_PROJECT_CONTENT_METADATA
          );

          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          
          const { status, _id, metadata } = appCmd.getCmdPayload();
          const projectContent = await projectContentDtoService.getProjectContent(_id);

          if (!projectContent) {
            throw new NotFoundError(`ProjectContent for "${_id}" id is not found`);
          }

          //TODO: Replace this validation with role based permission system
          const jwtUsername = ctx.state.user.username;
          const moderators = ctx.state.portal.profile.settings.moderation.moderators || [];
          const isModerator = moderators.includes(jwtUsername);
          const isAuthorized = await teamDtoService.authorizeTeamAccount(projectContent.teamId, jwtUsername)

          if (appCmd.getCmdNum() === APP_CMD.UPDATE_PROJECT_CONTENT_STATUS) {
            if (!PROJECT_CONTENT_STATUS[status]) {
              throw new BadRequestError(`This endpoint assepts only project-content status`)
            }
            if (metadata) {
              throw new BadRequestError(`Bad cmd`);
            }
            if (!isModerator) {
              throw new ForbiddenError(`"${jwtUsername}" is not permitted to edit status`);
            }
          }

          if (appCmd.getCmdNum() === APP_CMD.UPDATE_PROJECT_CONTENT_METADATA) {
            if (status) {
              throw new BadRequestError(`Bad cmd`);
            }
            if (!(isAuthorized || isModerator)) {
              throw new ForbiddenError(`"${jwtUsername}" is not permitted to edit metadata`);
            }
          }
        };

        const msg = ctx.state.msg;
        await projectContentCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });
}

const projectContentsCtrl = new ProjectContentsController();

module.exports = projectContentsCtrl;
