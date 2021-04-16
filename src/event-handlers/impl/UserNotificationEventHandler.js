import BaseEventHandler from './../base/BaseEventHandler';
import { APP_EVENT } from './../../constants';


class UserNotificationEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const userNotificationEventHandler = new UserNotificationEventHandler();


userNotificationEventHandler.register(APP_EVENT.PROJECT_CREATED, async (event, ctx) => {
  // TODO: send notifications about new project
  console.log(event);
});



module.exports = userNotificationEventHandler;