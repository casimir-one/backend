import BaseEvent from '../base/BaseEvent';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';


class UserAuthorityAlteredEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      username,
      ownerAuth,
      memoKey
    } = eventPayload;

    assert(!!username, "'username' is required");
    assert(!!ownerAuth, "'ownerAuth' required");

    super(APP_EVENT.USER_AUTHORITY_ALTERED, eventPayload);
  }

}


module.exports = UserAuthorityAlteredEvent;