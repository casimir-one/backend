import BaseEventHandler from './../base/BaseEventHandler';
import { USER_INVITE_STATUS } from './../../constants';
import { UserInviteService } from './../../services';
import { APP_EVENT } from '@deip/constants';


class UserInviteEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const userInviteEventHandler = new UserInviteEventHandler();

const userInviteService = new UserInviteService();


userInviteEventHandler.register(APP_EVENT.TEAM_INVITE_CREATED, async (event) => {
  const { proposalId, expirationTime, invitee, inviter, teamId, notes } = event.getEventPayload();

  await userInviteService.createUserInvite({
    _id: proposalId,
    invitee: invitee,
    creator: inviter,
    teamId: teamId,
    status: USER_INVITE_STATUS.SENT,
    notes: notes,
    expiration: expirationTime
  });

});

userInviteEventHandler.register(APP_EVENT.TEAM_INVITE_ACCEPTED, async (event) => {
  const { proposalId } = event.getEventPayload();

  await userInviteService.updateUserInvite(proposalId, {
    status: USER_INVITE_STATUS.APPROVED
  });

});




module.exports = userInviteEventHandler;