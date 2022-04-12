import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';


class NonFungibleTokenTransferedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      from,
      to,
      classId,
      instanceId
    } = eventPayload;

    assert(!!from, "'from' is required");
    assert(!!to, "'to' is required");
    assert(!!classId, "NFT 'classId' is required");
    assert(!!instanceId && !isNaN(instanceId), "NFT 'instanceId' is required");

    super(APP_EVENT.NFT_TRANSFERED, eventPayload);
  }

}

module.exports = NonFungibleTokenTransferedEvent;