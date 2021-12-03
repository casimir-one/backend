import BaseController from '../base/BaseController';
import { UserInviteService } from '../../services';
import { BadRequestError, ForbiddenError } from './../../errors';
import { accountCmdHandler } from './../../command-handlers';
import { APP_CMD, USER_NOTIFICATION_STATUS } from '@deip/constants';

const userInviteService = new UserInviteService();

class InvitesController extends BaseController {
  getUserInvites = this.query({
    h: async (ctx) => {
      try {
        const jwtUsername = ctx.state.user.username;
        const username = ctx.params.username;
        if (jwtUsername != username) {
          throw new ForbiddenError(`"${jwtUsername}" is not permitted to view invites for "${username}"`);
        }
    
        const activeInvites = await userInviteService.findUserPendingInvites(username);
        ctx.status = 200;
        ctx.body = activeInvites;
      } catch (err) {
        console.log(err);
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  getTeamPendingInvites = this.query({
    h: async (ctx) => {
      try {
        const jwtUsername = ctx.state.user.username;
        const teamId = ctx.params.teamId;
        
        const invites = await userInviteService.findTeamPendingInvites(teamId);
        ctx.status = 200;
        ctx.body = invites;
      } catch (err) {
        console.log(err);
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });
}

const invitesCtrl = new InvitesController();

module.exports = invitesCtrl;