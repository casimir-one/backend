import BaseEventHandler from './../base/BaseEventHandler';
import { USER_INVITE_STATUS } from './../../constants';
import UserInviteDtoService from './../../services/userInvites';
import APP_EVENT from './../../events/base/AppEvent';


class UserInviteEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const userInviteEventHandler = new UserInviteEventHandler();

const userInviteDtoService = new UserInviteDtoService();


userInviteEventHandler.register(APP_EVENT.PROJECT_INVITE_CREATED, async (event, ctx) => {
  const { proposalId, expirationTime, invitee, inviter, teamId, notes, projectId } = event.getEventPayload();

  await userInviteDtoService.createUserInvite({
    externalId: proposalId,
    invitee: invitee,
    creator: inviter,
    researchGroupExternalId: teamId,
    status: USER_INVITE_STATUS.SENT,
    researches: [{ externalId: projectId }],
    notes: notes,
    expiration: expirationTime
  });

});

userInviteEventHandler.register(APP_EVENT.PROJECT_MEMBER_JOINED, async (event, ctx) => {
  const { proposalCtx: { proposalId } } = event.getEventPayload();

  await userInviteDtoService.updateUserInvite(proposalId, {
    status: USER_INVITE_STATUS.APPROVED
  });

});




module.exports = userInviteEventHandler;