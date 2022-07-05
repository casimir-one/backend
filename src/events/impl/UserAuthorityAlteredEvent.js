import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@casimir/platform-core';
import assert from 'assert';


class UserAuthorityAlteredEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      username,
      authority,
    } = eventPayload;

    assert(!!username, "'username' is required");
    assert(!!authority, "'authority' required");

    super(APP_EVENT.USER_AUTHORITY_ALTERED, eventPayload);
  }

}


module.exports = UserAuthorityAlteredEvent;