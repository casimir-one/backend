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
        ctx.successRes(activeInvites);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  getTeamPendingInvites = this.query({
    h: async (ctx) => {
      try {
        const jwtUsername = ctx.state.user.username;
        const teamId = ctx.params.teamId;
        
        const invites = await userInviteService.findTeamPendingInvites(teamId);
        ctx.successRes(invites);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });
}

const invitesCtrl = new InvitesController();

module.exports = invitesCtrl;