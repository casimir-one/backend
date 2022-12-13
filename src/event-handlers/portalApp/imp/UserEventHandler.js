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
    _id: userId,
    pubKey,
    email,
    status,
    attributes,
  } = event.getEventPayload();

  await userService.createUser({
    _id: userId,
    pubKey,
    email,
    status,
    attributes
  });
});


userEventHandler.register(APP_EVENT.USER_UPDATED, async (event) => {
  const {
    _id: userId,
    pubKey,
    email,
    attributes,
  } = event.getEventPayload();

  await userService.updateUser(userId, {
    pubKey,
    email,
    attributes
  });
});


module.exports = userEventHandler;