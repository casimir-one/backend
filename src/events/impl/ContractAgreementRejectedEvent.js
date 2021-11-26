import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class ContractAgreementRejectedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId: contractAgreementId,
      party,
    } = eventPayload;

    assert(!!contractAgreementId, "'contractAgreementId' is required");
    assert(!!party, "'party' is required");

    super(APP_EVENT.CONTRACT_AGREEMENT_REJECTED, eventPayload);
  }

}

module.exports = ContractAgreementRejectedEvent;