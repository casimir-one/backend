import BaseEventHandler from './../base/BaseEventHandler';
import { EVENT } from './../../constants';


class UserNotificationEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const userNotificationEventHandler = new UserNotificationEventHandler();


userNotificationEventHandler.register(EVENT.PROJECT_CREATED, async (event, ctx) => {
  // TODO: send notifications about new project
  console.log(event);
});



module.exports = userNotificationEventHandler;