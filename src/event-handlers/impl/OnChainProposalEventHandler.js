import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';


class OnChainProposalEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }
}

const onChainProposalEventHandler = new OnChainProposalEventHandler();


onChainProposalEventHandler.register(APP_EVENT.CHAIN_PROPOSAL_PROPOSED, async (event) => {
  const {author, batch, proposal_id} = event.getEventPayload();
  console.log("CHAIN_PROPOSAL_PROPOSED", {
    author,
    proposal_id,
    batch
  })
  console.log('batch', batch);
});

onChainProposalEventHandler.register(APP_EVENT.CHAIN_PROPOSAL_APPROVED, async (event) => {
  console.log("CHAIN_PROPOSAL_APPROVED", event.getEventPayload())
});

onChainProposalEventHandler.register(APP_EVENT.CHAIN_PROPOSAL_REVOKED_APPROVAL, async (event) => {
  console.log("CHAIN_PROPOSAL_REVOKED_APPROVAL", event.getEventPayload())
});

onChainProposalEventHandler.register(APP_EVENT.CHAIN_PROPOSAL_RESOLVED, async (event) => {
  const {member, proposal_id, state} = event.getEventPayload();
  console.log('CHAIN_PROPOSAL_RESOLVED', {
    member,
    proposal_id,
    state
  })
  console.log("state", state)
});

onChainProposalEventHandler.register(APP_EVENT.CHAIN_PROPOSAL_EXPIRED, async (event) => {
  console.log("CHAIN_PROPOSAL_EXPIRED", event.getEventPayload())
});

module.exports = onChainProposalEventHandler;
