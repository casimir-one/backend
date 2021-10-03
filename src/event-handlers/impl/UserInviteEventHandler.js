import BaseEventHandler from './../base/BaseEventHandler';
import { USER_INVITE_STATUS } from './../../constants';
import UserInviteDtoService from './../../services/legacy/userInvites';
import APP_EVENT from './../../events/base/AppEvent';


class UserInviteEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const userInviteEventHandler = new UserInviteEventHandler();

const userInviteDtoService = new UserInviteDtoService();


userInviteEventHandler.register(APP_EVENT.TEAM_INVITE_CREATED, async (event) => {
  const { proposalId, expirationTime, invitee, inviter, teamId, notes } = event.getEventPayload();

  await userInviteDtoService.createUserInvite({
    externalId: proposalId,
    invitee: invitee,
    creator: inviter,
    researchGroupExternalId: teamId,
    status: USER_INVITE_STATUS.SENT,
    notes: notes,
    expiration: expirationTime
  });

});

userInviteEventHandler.register(APP_EVENT.TEAM_INVITE_ACCEPTED, async (event) => {
  const { proposalId } = event.getEventPayload();

  await userInviteDtoService.updateUserInvite(proposalId, {
    status: USER_INVITE_STATUS.APPROVED
  });

});




module.exports = userInviteEventHandler;