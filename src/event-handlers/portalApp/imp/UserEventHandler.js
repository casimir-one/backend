import { APP_EVENT, SYSTEM_ROLE as USER_ROLES } from '@deip/constants';
import {
  UserService
} from '../../../services';
import BaseEventHandler from '../../base/BaseEventHandler';


class UserEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const userEventHandler = new UserEventHandler();
const userService = new UserService();

userEventHandler.register(APP_EVENT.DAO_CREATED, async (event) => {

  const {
    isTeamAccount,
    daoId,
    creator,
    status,
    pubKey,
    email,
    attributes,
    roles
  } = event.getEventPayload();

  if (isTeamAccount) {
    const userInfo = await userService.getUser(creator);

    if (userInfo) {
      const updatedUserProfile = await userService.updateUser(creator, {
        status: userInfo.status,
        email: userInfo.email,
        attributes: userInfo.attributes,
        teams: [...userInfo.teams, daoId],
        roles: [...userInfo.roles, { role: USER_ROLES.TEAM_ADMIN, teamId: daoId }]
      });
    }
  } else {
    const createdUserProfile = await userService.createUser({
      username: daoId,
      status,
      signUpPubKey: pubKey,
      email,
      attributes,
      roles: roles.map(r => ({
        role: r.role,
        teamId: r.teamId
      }))
    });
  }
});

userEventHandler.register(APP_EVENT.DAO_UPDATED, async (event) => {

  const {
    isTeamAccount,
    daoId,
    status,
    email,
    attributes
  } = event.getEventPayload();

  if (!isTeamAccount) {
    const updatedUserProfile = await userService.updateUser(daoId, {
      status,
      email,
      attributes
    });
  }
});

userEventHandler.register(APP_EVENT.USER_AUTHORITY_ALTERED, async (event) => {

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