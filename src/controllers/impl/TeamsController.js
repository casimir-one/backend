import qs from 'qs';
import { APP_CMD } from '@deip/constants';
import BaseController from './../base/BaseController';
import { TeamForm } from '../../forms';
import { BadRequestError, NotFoundError, ConflictError } from '../../errors';
import { accountCmdHandler } from '../../command-handlers';
import { TeamDtoService, TeamService, UserService } from '../../services';
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
        ctx.successRes(team);

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getTeams = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const teamsIds = query.teamsIds;
        if (!Array.isArray(teamsIds)) {
          throw new BadRequestError(`TeamsIds must be an array of ids`);
        }

        const result = await teamDtoService.getTeams(teamsIds);
        ctx.successRes(result);

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getTeamsListing = this.query({
    h: async (ctx) => {
      try {

        const { withPortalTeam } = qs.parse(ctx.query);

        const result = await teamDtoService.getTeamsListing(withPortalTeam);
        ctx.successRes(result);

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getTeamsListingPaginated = this.query({
    h: async (ctx) => {
      try {
        const { filter = {}, sort, page, pageSize } = qs.parse(ctx.query);

        const { result, paginationMeta } = await teamDtoService.lookupTeams(filter, sort, { page, pageSize });

        ctx.successRes(result, { extraInfo: paginationMeta });
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getTeamsByUser = this.query({
    h: async (ctx) => {
      try {
        const { withPortalTeam } = qs.parse(ctx.query);

        const username = ctx.params.username;
        const result = await teamDtoService.getTeamsByUser(username, withPortalTeam);
        ctx.successRes(result);

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getTeamsByPortal = this.query({
    h: async (ctx) => {
      try {
        const { withPortalTeam } = qs.parse(ctx.query);

        const portalId = ctx.params.portalId;
        const result = await teamDtoService.getTeamsByPortal(portalId, withPortalTeam);
        ctx.successRes(result);

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  createTeam = this.command({
    form: TeamForm,
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_DAO);
          if (appCmd.getCmdNum() === APP_CMD.CREATE_DAO) {
            const { isTeamAccount } = appCmd.getCmdPayload();
            if (!isTeamAccount) {
              throw new BadRequestError(`This endpoint should be for team account`);
            }
          }
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };

        const msg = ctx.state.msg;
        await accountCmdHandler.process(msg, ctx, validate);

        const entityId = this.extractEntityId(msg, APP_CMD.CREATE_DAO);

        ctx.successRes({ _id: entityId });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  updateTeam = this.command({
    form: TeamForm,
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_DAO || cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.UPDATE_DAO) {
            const {
              isTeamAccount
            } = appCmd.getCmdPayload();
            if (!isTeamAccount) {
              throw new BadRequestError(`This endpoint should be for team account`);
            }
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();
            if (!proposedCmds.some(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_DAO)) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.UPDATE_DAO]} protocol cmd`);
            }
          }
        };

        const msg = ctx.state.msg;
        await accountCmdHandler.process(msg, ctx, validate);

        const entityId = this.extractEntityId(msg, APP_CMD.UPDATE_DAO);

        ctx.successRes({ _id: entityId });

      } catch (err) {
        ctx.errorRes(err);
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
          const joinTeamCmd = proposedCmds.find(cmd => cmd.getCmdNum() === APP_CMD.ADD_DAO_MEMBER);

          if (!joinTeamCmd) {
            throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.ADD_DAO_MEMBER]} protocol cmd`);
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

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
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
          const leaveTeamCmd = proposedCmds.find(cmd => cmd.getCmdNum() === APP_CMD.REMOVE_DAO_MEMBER);

          if (!leaveTeamCmd) {
            throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.REMOVE_DAO_MEMBER]} protocol cmd`);
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

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
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

        let src = FileStorage.getTeamLogoFilePath(teamId);
        const defaultTeamLogo = FileStorage.getTeamDefaultLogoFilePath();

        let buff;

        if (src != defaultTeamLogo) {
          const filepath = FileStorage.getTeamLogoFilePath(teamId);
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
        ctx.successRes(logo, { withoutWrap: true });
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }

    }
  });
}


const teamsCtrl = new TeamsController();


module.exports = teamsCtrl;
