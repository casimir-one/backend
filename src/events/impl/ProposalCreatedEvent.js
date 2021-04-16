import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from './../../constants';


class ProposalCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    super(APP_EVENT.PROPOSAL_CREATED, eventPayload);
  }

}


module.exports = ProposalCreatedEvent;