import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';


class DaoCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      daoId,
      isTeamAccount,
      status,
      pubKey,
      email,
      attributes,
      roles
    } = eventPayload;

    assert(!!daoId, "'daoId' is required");
    if (!isTeamAccount) {
      assert(!!daoId, "'daoId' is required");
      assert(!!attributes, "'attributes' required");
      assert(!!email, "'email' required");
      assert(!!status, "'status' required");
      assert(!!pubKey, "'pubKey' required");
      assert(Array.isArray(roles), "'roles' should be array");
    }

    super(APP_EVENT.DAO_CREATED, eventPayload);
  }

}


module.exports = DaoCreatedEvent;