import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@casimir.one/platform-core';
import assert from 'assert';


class ProposalDeclinedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalId,
      status,
      proposalCtx
    } = eventPayload;

    assert(!!proposalId, "'proposalId' is required");
    assert(!!status, "'status' is required");
    assert(!!proposalCtx, "'proposalCtx' is required");

    super(APP_EVENT.PROPOSAL_DECLINED, eventPayload);
  }

}


module.exports = ProposalDeclinedEvent;