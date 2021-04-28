import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';


class ProposalDeclinedEvent extends BaseEvent {

  constructor(eventPayload) {
    super(APP_EVENT.PROPOSAL_DECLINED, eventPayload);
  }

}


module.exports = ProposalDeclinedEvent;