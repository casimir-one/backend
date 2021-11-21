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
      activationTime,
      expirationTime,
      type,
      terms
    } = eventPayload;

    assert(!!contractAgreementId, "'contractAgreementId' is required");
    assert(!!creator, "'creator' is required");
    assert(!!hash, "'hash' is required");
    assert(!!type, "'type' is required");
    assert(!!terms, "'terms' is required");
    assert(!!parties && Array.isArray(parties) && parties.length > 1, "'parties' is required");

    if (expirationTime && activationTime) {
      assert(new Date(expirationTime) > new Date(activationTime), "'expirationTime' must be greater than 'activationTime'");
    } else if (expirationTime) {
      assert(new Date(expirationTime) > new Date(), "'expirationTime' must be greater than current time");
    } else if (activationTime) {
      assert(new Date(activationTime) > new Date(), "'activationTime' must be greater than current time");
    }

    if (type == CONTRACT_AGREEMENT_TYPE.PROJECT_LICENSE) {
      assert(!!terms.projectId, "'projectId' is required");
      assert(!!terms.price, "'price' is required");
    }

    super(APP_EVENT.CONTRACT_AGREEMENT_CREATED, eventPayload);
  }

}

module.exports = ContractAgreementCreatedEvent;