import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';


class DaoUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      daoId,
      isTeamAccount,
      attributes,
      email,
      status
    } = eventPayload;

    assert(!!daoId, "'daoId' is required");
    assert(!!attributes && attributes.length, "'attributes' required");
    if (!isTeamAccount) {
      assert(!!status, "'status' required");
    }

    super(APP_EVENT.DAO_UPDATED, eventPayload);
  }

}


module.exports = DaoUpdatedEvent;