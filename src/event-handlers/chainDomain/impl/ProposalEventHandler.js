import { DOMAIN_EVENT, PROPOSAL_STATUS } from '@deip/constants';
import { ProposalService } from '../../../services';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';

class ProposalEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const proposalEventHandler = new ProposalEventHandler();

const proposalService = new ProposalService();

proposalEventHandler.register(DOMAIN_EVENT.PROPOSAL_CREATED, async (event) => {
  console.log("CHAIN_PROPOSAL.PROPOSAL_CREATED", event.getEventPayload())
  //TODO: handler
});

proposalEventHandler.register(DOMAIN_EVENT.PROPOSAL_APPROVED, async (event) => {
  console.log("CHAIN_PROPOSAL.PROPOSAL_APPROVED", event.getEventPayload())
  //TODO: handler
});

proposalEventHandler.register(DOMAIN_EVENT.PROPOSAL_REVOKED_APPROVAL, async (event) => {
  console.log("CHAIN_PROPOSAL.REVOKED_APPROVAL", event.getEventPayload())
});

proposalEventHandler.register(DOMAIN_EVENT.PROPOSAL_RESOLVED, async (event) => {
  const {
    proposal_id: proposalIdBuffer,
    state //??? 
  } = event.getEventPayload();

  const proposalId = Buffer.from(proposalIdBuffer).toString('hex');
  await proposalService.updateProposal(proposalId, {
    status: PROPOSAL_STATUS.APPROVED,
  });
});

proposalEventHandler.register(DOMAIN_EVENT.PROPOSAL_EXPIRED, async (event) => {
  const {
    proposal_id: proposalIdBuffer,
  } = event.getEventPayload();

  const proposalId = Buffer.from(proposalIdBuffer).toString('hex');
  await proposalService.updateProposal(proposalId, {
    status: PROPOSAL_STATUS.EXPIRED,
  });
});

module.exports = proposalEventHandler;
