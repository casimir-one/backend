import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';

class NotificationsMarkedAsReadEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      username,
      markAll,
      notifications
    } = eventPayload;

    assert(!!username, "'username' is required");
    assert(markAll ? markAll : (!!notifications && Array.isArray(notifications) && notifications.length),
    "if 'markAll' is false, 'notifications' is required");

    super(APP_EVENT.NOTIFICATIONS_MARKED_AS_READ, eventPayload);
  }

}

module.exports = NotificationsMarkedAsReadEvent;