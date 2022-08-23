import { SYSTEM_ROLE, APP_EVENT, USER_PROFILE_STATUS } from '@casimir/platform-core';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';
import { UserService } from './../../../services';
import { ChainService, SubstrateChainUtils } from '@casimir/chain-service';
import config from '../../../config';

class UserEventHandler extends PortalAppEventHandler {

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
        roles: [...userInfo.roles, { role: SYSTEM_ROLE.TEAM_ADMIN, teamId: daoId }]
      });
    }
  } else {
    const chainService = await ChainService.getInstanceAsync(config);
    const { registry } = chainService.getChainNodeClient();

    const address = SubstrateChainUtils.toAddress(daoId, registry)

    const createdUserProfile = await userService.createUser({
      username: daoId,
      status,
      signUpPubKey: pubKey,
      email,
      attributes,
      roles: roles.map(r => ({
        role: r.role,
        teamId: r.teamId
      })),
      address
    });
  }
});

userEventHandler.register(APP_EVENT.DAO_IMPORTED, async (event) => {

  const {
    daoId,
    status,
    pubKey,
    attributes,
    roles
  } = event.getEventPayload();

  const chainService = await ChainService.getInstanceAsync(config);
  const { registry } = chainService.getChainNodeClient();

  const address = SubstrateChainUtils.toAddress(daoId, registry)
  const createdUserProfile = await userService.createUser({
    username: daoId,
    status,
    signUpPubKey: pubKey,
    attributes,
    roles: roles.map(r => ({
      role: r.role,
      teamId: r.teamId
    })),
    address,
    email: null
  });
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

module.exports = userEventHandler;