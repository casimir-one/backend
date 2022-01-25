import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { SYSTEM_ROLE as USER_ROLES } from '@deip/constants';
import {
  UserService
} from './../../services';


class UserEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const userEventHandler = new UserEventHandler();
const userService = new UserService();

userEventHandler.register(APP_EVENT.USER_CREATED, async (event) => {

  const {
    username,
    status,
    pubKey,
    portalId,
    email,
    attributes,
    roles
  } = event.getEventPayload();

  const createdUserProfile = await userService.createUser({
    username,
    status,
    signUpPubKey: pubKey,
    portal: portalId,
    email,
    attributes,
    roles: roles.map(r => ({
      role: r.role,
      teamId: r.teamId || portalId
    }))
  });
});

userEventHandler.register(APP_EVENT.USER_UPDATED, async (event) => {

  const {
    username,
    status,
    email,
    attributes
  } = event.getEventPayload();

  const updatedUserProfile = await userService.updateUser(username, {
    status,
    email,
    attributes
  });
});

userEventHandler.register(APP_EVENT.USER_AUTHORITY_ALTERED, async (event) => {

});

userEventHandler.register(APP_EVENT.TEAM_CREATED, async (event) => {

  const { creator, accountId } = event.getEventPayload();

  const userInfo = await userService.getUser(creator);

  if (userInfo) { 
    const updatedUserProfile = await userService.updateUser(creator, {
      status: userInfo.status,
      email: userInfo.email,
      attributes: userInfo.attributes,
      teams: [...userInfo.teams, accountId],
      roles: [...userInfo.roles, { role: USER_ROLES.TEAM_ADMIN,  teamId: accountId }]
    });
  }

});

userEventHandler.register(APP_EVENT.DAO_MEMBER_ADDED, async (event) => {
  const {
    member,
    teamId
  } = event.getEventPayload();

  const userInfo = await userService.getUser(member);

  const updatedUserProfile = await userService.updateUser(member, {
    teams: [...userInfo.teams, teamId]
  });

});

userEventHandler.register(APP_EVENT.DAO_MEMBER_REMOVED, async (event) => {
  const {
    member,
    teamId
  } = event.getEventPayload();

  const userInfo = await userService.getUser(member);
  const updatedTeams = [...userInfo.teams];
  const index = updatedTeams.indexOf(teamId);
  updatedTeams.splice(index, 1);

  const updatedUserProfile = await userService.updateUser(member, {
    teams: updatedTeams
  });
});

userEventHandler.register(APP_EVENT.USER_PROFILE_DELETED, async (event) => {
  const { username } = event.getEventPayload();

  await userService.deleteUser(username);
});

module.exports = userEventHandler;