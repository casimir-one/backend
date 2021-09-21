import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';
import { CONTRACT_AGREEMENT_TYPE } from '@deip/constants';

class ContractAgreementCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId: contractAgreementId,
      creator,
      parties,
      hash,
      startTime,
      endTime,
      type,
      terms
    } = eventPayload;

    assert(!!contractAgreementId, "'contractAgreementId' is required");
    assert(!!creator, "'creator' is required");
    assert(!!endTime, "'endTime' is required");
    assert(!!hash, "'hash' is required");
    assert(!!type, "'type' is required");
    assert(!!terms, "'terms' is required");
    assert(!!parties && Array.isArray(parties) && parties.length > 1, "'parties' is required");
    assert(startTime ? new Date(endTime) > new Date(startTime) : new Date(endTime) > new Date(), "'endTime' must be greater than current time or 'startTime'");

    if (type == CONTRACT_AGREEMENT_TYPE.PROJECT_LICENSE) {
      assert(!!terms.projectId, "'projectId' is required");
      assert(!!terms.fee, "'fee' is required");
    }

    super(APP_EVENT.CONTRACT_AGREEMENT_CREATED, eventPayload);
  }

}

module.exports = ContractAgreementCreatedEvent;