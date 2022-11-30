import { APP_EVENT } from '@casimir.one/platform-core';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';
import { UserService } from './../../../services';
import config from '../../../config';

class UserEventHandler extends PortalAppEventHandler {

  constructor() {
    super();
  }

}

const userEventHandler = new UserEventHandler();
const userService = new UserService();


userEventHandler.register(APP_EVENT.USER_CREATED, async (event) => {
  const {
    entityId: userId,
    pubKey,
    email,
    status,
    attributes,
    roles
  } = event.getEventPayload();

  await userService.createUser({
    _id: userId,
    pubKey,
    email,
    status,
    attributes,
    roles: roles.map(r => ({
      role: r.role,
      teamId: r.teamId
    }))
  });
});

module.exports = userEventHandler;