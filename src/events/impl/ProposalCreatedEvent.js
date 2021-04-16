import BaseEvent from './../base/BaseEvent';
import { EVENT } from './../../constants';


class ProposalCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    super(EVENT.PROPOSAL_CREATED, eventPayload);
  }

}


module.exports = ProposalCreatedEvent;