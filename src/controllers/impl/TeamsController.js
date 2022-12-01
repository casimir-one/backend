import qs from 'qs';
import { APP_CMD, APP_PROPOSAL } from '@casimir.one/platform-core';
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

        const { result, paginationMeta } = await teamDtoService.lookupTeamsPaginated(filter, sort, { page, pageSize });

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

        const _id = ctx.params._id;
        const result = await teamDtoService.getTeamsByUser(_id, withPortalTeam);
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
          const validateCreateTeam = async (createTeamCmd, cmdStack) => {
            const { isTeamAccount } = createTeamCmd.getCmdPayload();
            if (!isTeamAccount) {
              throw new BadRequestError(`This endpoint should be for team account`);
            }
          };

          const createTeamSettings = {
            cmdNum: APP_CMD.CREATE_DAO,
            validate: validateCreateTeam
          };
          
          const validCmdsOrder = [createTeamSettings];
          
          await this.validateCmds(appCmds, validCmdsOrder);
        };

        const msg = ctx.state.msg;
        await accountCmdHandler.process(msg, ctx, validate);

        const _id = this.extractEntityId(msg, APP_CMD.CREATE_DAO);

        ctx.successRes({ _id: _id });

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
          const validateUpdateDao = (updateDaoCmd, cmdStack) => {
            const {
              isTeamAccount
            } = updateDaoCmd.getCmdPayload();

            if (!isTeamAccount) {
              throw new BadRequestError(`This endpoint should be for team account`);
            }
          }

          const validateAcceptProposal = (acceptProposalCmd, cmdStack) => {
            const { _id } = acceptProposalCmd.getCmdPayload();
            const createProposalCmd = cmdStack.find(c => c.getCmdPayload()._id === _id);
            if (!createProposalCmd) {
              throw new BadRequestError(`Can't accept proposal`);
            }
          };

          const updateDaoSettings = {
            cmdNum: APP_CMD.UPDATE_DAO,
            validate: validateUpdateDao
          }

          const createProposalSettings = {
            cmdNum: APP_CMD.CREATE_PROPOSAL,
            proposalType: APP_PROPOSAL.TEAM_UPDATE_PROPOSAL,
            proposedCmdsOrder: [updateDaoSettings]
          };

          const acceptProposalSettings = {
            cmdNum: APP_CMD.ACCEPT_PROPOSAL,
            validate: validateAcceptProposal
          }

          // array of orders if can be a few valid orders
          const validCmdsOrders = [
            [updateDaoSettings],
            [createProposalSettings],
            [createProposalSettings, acceptProposalSettings]
          ];

          await this.validateCmds(appCmds, validCmdsOrders);
        };

        const msg = ctx.state.msg;
        await accountCmdHandler.process(msg, ctx, validate);

        const _id = this.extractEntityId(msg, APP_CMD.UPDATE_DAO);

        ctx.successRes({ _id: _id });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  joinTeam = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const validateJoinTeam = async (joinTeamCmd, cmdStack) => {
            const { member, teamId } = joinTeamCmd.getCmdPayload();
            const user = await userService.getUser(member);

            if (!user) {
              throw new NotFoundError(`User "${member}" _id is not found`);
            }

            const team = await teamService.getTeam(teamId);
            if (team.members.includes(member)) {
              throw new ConflictError(`User ${member} _id already joined`);
            }
          };

          const validateAcceptProposal = (acceptProposalCmd, cmdStack) => {
            const { _id } = acceptProposalCmd.getCmdPayload();
            const createProposalCmd = cmdStack.find(c => c.getCmdPayload()._id === _id);
            if (!createProposalCmd) {
              throw new BadRequestError(`Can't accept proposal`);
            }
          };

          const joinTeamSettings = {
            cmdNum: APP_CMD.ADD_DAO_MEMBER,
            validate: validateJoinTeam
          };

          const createProposalSettings = {
            cmdNum: APP_CMD.CREATE_PROPOSAL,
            proposalType: APP_PROPOSAL.ADD_DAO_MEMBER_PROPOSAL,
            proposedCmdsOrder: [joinTeamSettings]
          };

          const acceptProposalSettings = {
            cmdNum: APP_CMD.ACCEPT_PROPOSAL,
            validate: validateAcceptProposal
          }

          // array of orders if can be a few valid orders
          const validCmdsOrders = [
            [createProposalSettings],
            [createProposalSettings, acceptProposalSettings]
          ];
          
          await this.validateCmds(appCmds, validCmdsOrders);
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
          const validateLeaveTeam = async (leaveTeamCmd, cmdStack) => {
            const { member, teamId } = leaveTeamCmd.getCmdPayload();
            const user = await userService.getUser(member);

            if (!user) {
              throw new NotFoundError(`User "${member}" _id is not found`);
            }

            const team = await teamService.getTeam(teamId);
            if (!team.members.includes(member)) {
              throw new ConflictError(`User ${member} _id already left`);
            }
          };

          const validateAcceptProposal = (acceptProposalCmd, cmdStack) => {
            const { _id } = acceptProposalCmd.getCmdPayload();
            const createProposalCmd = cmdStack.find(c => c.getCmdPayload()._id === _id);
            if (!createProposalCmd) {
              throw new BadRequestError(`Can't accept proposal`);
            }
          };

          const leaveTeamSettings = {
            cmdNum: APP_CMD.REMOVE_DAO_MEMBER,
            validate: validateLeaveTeam
          };

          const createProposalSettings = {
            cmdNum: APP_CMD.CREATE_PROPOSAL,
            proposalType: APP_PROPOSAL.REMOVE_DAO_MEMBER_PROPOSAL,
            proposedCmdsOrder: [leaveTeamSettings]
          };

          const acceptProposalSettings = {
            cmdNum: APP_CMD.ACCEPT_PROPOSAL,
            validate: validateAcceptProposal
          }

          // array of orders if can be a few valid orders
          const validCmdsOrders = [
            [createProposalSettings],
            [createProposalSettings, acceptProposalSettings]
          ];
          
          await this.validateCmds(appCmds, validCmdsOrders);
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
