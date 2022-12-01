import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';


class UserAuthorityAlteredEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      _id,
      authority,
    } = eventPayload;

    assert(!!_id, "'_id' is required");
    assert(!!authority, "'authority' required");

    super(APP_EVENT.USER_AUTHORITY_ALTERED, eventPayload);
  }

}


module.exports = UserAuthorityAlteredEvent;