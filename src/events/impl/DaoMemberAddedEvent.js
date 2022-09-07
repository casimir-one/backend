import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';


class DaoMemberAddedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      member,
      teamId
    } = eventPayload;

    assert(!!member, "'member' is required");
    assert(!!teamId, "'teamId' is required");

    super(APP_EVENT.DAO_MEMBER_ADDED, eventPayload);
  }

}


module.exports = DaoMemberAddedEvent;