import qs from 'qs';
import { APP_CMD } from '@deip/command-models';
import { RESEARCH_STATUS } from './../../constants';
import BaseController from './../base/BaseController';
import { TeamForm } from './../../forms';
import { AppError, BadRequestError, NotFoundError, ConflictError } from './../../errors';
import { accountCmdHandler } from './../../command-handlers';
import { TeamService, TeamDtoService } from './../../services';


const teamService = new TeamService();
const teamDtoService = new TeamDtoService();


class TeamsController extends BaseController {
  getTeam = this.query({
    h: async (ctx) => {
      try {

        const teamId = ctx.params.teamId;
        const result = await teamDtoService.getTeam(teamId);
        ctx.status = 200;
        ctx.body = result;

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
    form: TeamForm, h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_ACCOUNT);
          if(appCmd.getCmdNum() === APP_CMD.CREATE_ACCOUNT) {
            const {isTeamAccount} = appCmd.getCmdPayload();
            if(!isTeamAccount) {
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
        ctx.body = { entityId };
        
      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });


  updateTeam = this.command({
    form: TeamForm, h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT || cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if(appCmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT) {
            const {isTeamAccount} = appCmd.getCmdPayload();
            if(!isTeamAccount) {
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
        if(appCmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT) {
          entityId = appCmd.getCmdPayload().entityId;
        } else if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
          const proposedCmds = appCmd.getProposedCmds();
          const updateCmd = proposedCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_ACCOUNT)
          entityId = updateCmd.getCmdPayload().entityId;
        }

        await accountCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = { entityId };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });
}


const teamsCtrl = new TeamsController();


module.exports = teamsCtrl;