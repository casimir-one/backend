import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';


class ProposalUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    super(APP_EVENT.PROPOSAL_UPDATED, eventPayload);
  }

}


module.exports = ProposalUpdatedEvent;