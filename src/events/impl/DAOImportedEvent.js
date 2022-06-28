import { APP_EVENT } from '@deip/constants';
import assert from 'assert';
import BaseEvent from '../base/BaseEvent';


class DAOImportedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      daoId,
      isTeamAccount,
      status,
      pubKey,
      attributes,
      roles
    } = eventPayload;

    assert(!!daoId, "'daoId' is required");
    assert(!isTeamAccount, "Dao must belong to a user");
    assert(!!daoId, "'daoId' is required");
    assert(!!attributes, "'attributes' required");
    assert(!!status, "'status' required");
    assert(!!pubKey, "'pubKey' required");
    assert(Array.isArray(roles), "'roles' should be array");

    super(APP_EVENT.DAO_IMPORTED, eventPayload);
  }

}


module.exports = DAOImportedEvent;