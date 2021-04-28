import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';


class ProposalSignaturesUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    super(APP_EVENT.PROPOSAL_SIGNATURES_UPDATED, eventPayload);
  }

}


module.exports = ProposalSignaturesUpdatedEvent;