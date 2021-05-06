import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class ProposalUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalId,
      status,
      proposalCtx
    } = eventPayload;

    assert(!!proposalId, "'proposalId' is required");
    assert(!!status, "'status' is required");
    assert(!!proposalCtx, "'proposalCtx' is required");

    super(APP_EVENT.PROPOSAL_UPDATED, eventPayload);
  }

}


module.exports = ProposalUpdatedEvent;