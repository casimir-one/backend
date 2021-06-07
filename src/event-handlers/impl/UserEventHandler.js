import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
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

module.exports = userEventHandler;