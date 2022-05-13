import { DOMAIN_EVENT } from '@deip/constants';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';


class ProposalEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const proposalEventHandler = new ProposalEventHandler();


proposalEventHandler.register(DOMAIN_EVENT.PROPOSAL_PROPOSED, async (event) => {
  const { author, batch, proposal_id } = event.getEventPayload();
  console.log("CHAIN_PROPOSAL_PROPOSED", {
    author,
    proposal_id,
    batch
  })
  console.log('batch', batch);
});

proposalEventHandler.register(DOMAIN_EVENT.PROPOSAL_APPROVED, async (event) => {
  console.log("CHAIN_PROPOSAL_APPROVED", event.getEventPayload())
});

proposalEventHandler.register(DOMAIN_EVENT.PROPOSAL_REVOKED_APPROVAL, async (event) => {
  console.log("CHAIN_PROPOSAL_REVOKED_APPROVAL", event.getEventPayload())
});

proposalEventHandler.register(DOMAIN_EVENT.PROPOSAL_RESOLVED, async (event) => {
  const { member, proposal_id, state } = event.getEventPayload();
  console.log('CHAIN_PROPOSAL_RESOLVED', {
    member,
    proposal_id,
    state
  })
  console.log("state", state)
});

proposalEventHandler.register(DOMAIN_EVENT.PROPOSAL_EXPIRED, async (event) => {
  console.log("CHAIN_PROPOSAL_EXPIRED", event.getEventPayload())
});

module.exports = proposalEventHandler;
