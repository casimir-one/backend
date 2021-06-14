import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { USER_ROLES } from './../../constants';
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
    tenantId,
    email,
    attributes,
    roles
  } = event.getEventPayload();

  const createdUserProfile = await userService.createUser({
    username,
    status,
    signUpPubKey: pubKey,
    tenant: tenantId,
    email,
    attributes,
    roles: roles.map(r => ({
      role: r.role,
      researchGroupExternalId: r.researchGroupExternalId || tenantId
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

userEventHandler.register(APP_EVENT.TEAM_CREATED, async (event) => {

  const { creator, accountId } = event.getEventPayload();

  const userInfo = await userService.getUser(creator);

  if (userInfo) { 
    const updatedUserProfile = await userService.updateUser(creator, {
      status: userInfo.status,
      email: userInfo.email,
      attributes: userInfo.attributes,
      roles: [...userInfo.roles, { role: USER_ROLES.TEAMADMIN,  researchGroupExternalId: accountId }]
    });
  }

});

module.exports = userEventHandler;