import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';


class ProposalCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      proposalId,
      type,
      status,
      proposalCmd,
    } = eventPayload;

    assert(!!proposalId, "'proposalId' is required");
    assert(!!type, "'type' is required");
    assert(!!status, "'status' is required");
    assert(!!proposalCmd, "'proposalCmd' is required");

    super(APP_EVENT.PROPOSAL_CREATED, eventPayload);
  }

}


module.exports = ProposalCreatedEvent;