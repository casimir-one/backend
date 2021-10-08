import qs from 'qs';
import { APP_CMD } from '@deip/constants';
import BaseController from './../base/BaseController';
import { TeamForm } from './../../forms';
import { BadRequestError, NotFoundError, ConflictError } from './../../errors';
import { accountCmdHandler } from './../../command-handlers';
import { TeamDtoService, TeamService, UserService } from './../../services';
import sharp from 'sharp'
import slug from 'limax';
import FileStorage from './../../storage';


const teamDtoService = new TeamDtoService();
const teamService = new TeamService();
const userService = new UserService();

class TeamsController extends BaseController {

  getTeam = this.query({
    h: async (ctx) => {
      try {

        const teamId = ctx.params.teamId;
        const team = await teamDtoService.getTeam(teamId);
        if (!team) {
          throw new NotFoundError(`Team "${teamId}" id is not found`);
        }
        ctx.status = 200;
        ctx.body = team;

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });


  getTeamsListing = this.query({
    h: async (ctx) => {
      try {

        const query = qs.parse(ctx.query);
        const isPersonal = query.personal;

        const result = await teamDtoService.getTeamsListing(isPersonal);
        ctx.status = 200;
        ctx.body = result;

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  getTeamsByUser = this.query({
    h: async (ctx) => {
      try {

        const username = ctx.params.username;
        const result = await teamDtoService.getTeamsByUser(username);
        ctx.status = 200;
        ctx.body = result;

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  getTeamsByTenant = this.query({
    h: async (ctx) => {
      try {

        const tenantId = ctx.params.tenantId;
        const result = await teamDtoService.getTeamsByTenant(tenantId);
        ctx.status = 200;
        ctx.body = result;

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });


  createTeam = this.command({
    form: TeamForm,
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_ACCOUNT);
          if (appCmd.getCmdNum() === APP_CMD.CREATE_ACCOUNT) {
            const {
              isTeamAccount
            } = appCmd.getCmdPayload();
            if (!isTeamAccount) {
              throw new BadRequestError(`This endpoint should be for team account`);
            }
          }
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };

        const msg = ctx.state.msg;
        const appCmd = msg.appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_ACCOUNT);
        const entityId = appCmd.getCmdPayload().entityId;

        await accountCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = {
          entityId
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });


  updateTeam = this.command({
    form: TeamForm,
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT || cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT) {
            const {
              isTeamAccount
            } = appCmd.getCmdPayload();
            if (!isTeamAccount) {
              throw new BadRequestError(`This endpoint should be for team account`);
            }
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();
            if (!proposedCmds.some(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT)) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.UPDATE_ACCOUNT]} protocol cmd`);
            }
          }
        };

        const msg = ctx.state.msg;
        const appCmd = msg.appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT || cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
        let entityId = '';
        if (appCmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT) {
          entityId = appCmd.getCmdPayload().entityId;
        } else if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
          const proposedCmds = appCmd.getProposedCmds();
          const updateCmd = proposedCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT)
          entityId = updateCmd.getCmdPayload().entityId;
        }

        await accountCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = {
          entityId
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  joinTeam = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }

          const proposedCmds = appCmd.getProposedCmds();
          const joinTeamCmd = proposedCmds.find(cmd => cmd.getCmdNum() === APP_CMD.JOIN_TEAM);

          if (!joinTeamCmd) {
            throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.JOIN_TEAM]} protocol cmd`);
          }
          const { member, teamId } = joinTeamCmd.getCmdPayload();
          const user = await userService.getUser(member);

          if (!user) {
            throw new NotFoundError(`User "${member}" username is not found`);
          }

          const team = await teamService.getTeam(teamId);
          if (team.members.includes(member)) {
            throw new ConflictError(`User ${member} username already joined`);
          }
        };

        const msg = ctx.state.msg;

        await accountCmdHandler.process(msg, ctx, validate);

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

  leaveTeam = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }

          const proposedCmds = appCmd.getProposedCmds();
          const leaveTeamCmd = proposedCmds.find(cmd => cmd.getCmdNum() === APP_CMD.LEAVE_TEAM);

          if (!leaveTeamCmd) {
            throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.LEAVE_TEAM]} protocol cmd`);
          }
          const { member, teamId } = leaveTeamCmd.getCmdPayload();
          const user = await userService.getUser(member);

          if (!user) {
            throw new NotFoundError(`User "${member}" username is not found`);
          }

          const team = await teamService.getTeam(teamId);
          if (!team.members.includes(member)) {
            throw new ConflictError(`User ${member} username already left`);
          }
        };

        const msg = ctx.state.msg;

        await accountCmdHandler.process(msg, ctx, validate);

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

  getTeamLogo = this.query({
    h: async (ctx) => {
      try {
        const teamId = ctx.params.teamId;
        const width = ctx.query.width ? parseInt(ctx.query.width) : 1440;
        const height = ctx.query.height ? parseInt(ctx.query.height) : 430;
        const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
        const isRound = ctx.query.round ? ctx.query.round === 'true' : false;

        let src = FileStorage.getResearchGroupLogoFilePath(teamId);
        const defaultTeamLogo = FileStorage.getResearchGroupDefaultLogoFilePath();

        let buff;

        if (src != defaultTeamLogo) {
          const filepath = FileStorage.getResearchGroupLogoFilePath(teamId);
          const exists = await FileStorage.exists(filepath);
          if (exists) {
            buff = await FileStorage.get(filepath);
          } else {
            src = defaultTeamLogo;
          }
        } else {
          src = defaultTeamLogo;
        }

        const resize = (w, h) => {
          return new Promise((resolve) => {
            sharp.cache(!noCache);
            sharp(buff || src)
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

        let logo = await resize(width, height);

        if (isRound) {
          let round = (w) => {
            let r = w / 2;
            let circleShape = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);
            return new Promise((resolve, reject) => {
              logo = sharp(logo)
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

          logo = await round(width);
        }

        ctx.type = 'image/png';
        ctx.body = logo;
      } catch (err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err;
      }

    }
  });

  getTeamAttributeFile = this.query({
    h: async (ctx) => {
      try {
        const teamId = ctx.params.teamId;
        const attributeId = ctx.params.attributeId;
        const filename = ctx.params.filename;

        const isTeamRootFolder = teamId == attributeId;
        const filepath = isTeamRootFolder ? FileStorage.getResearchGroupFilePath(teamId, filename) : FileStorage.getResearchGroupAttributeFilePath(teamId, attributeId, filename);
        let buff = await FileStorage.get(filepath);

        const imageQuery = ctx.query.image === 'true';
        if (imageQuery) {
          const exists = await FileStorage.exists(filepath);
          if (!exists) {
            filepath = FileStorage.getResearchGroupDefaultLogoFilePath();
            buff = await FileStorage.get(filepath);
          }

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


const teamsCtrl = new TeamsController();


module.exports = teamsCtrl;