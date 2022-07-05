import { DOMAIN_EVENT, ProposalStatus } from '@casimir/platform-core';
import { ProposalService } from '../../../services';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';
import { logWarn } from './../../../utils/log';

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
  console.log("CHAIN_PROPOSAL.PROPOSAL_REVOKED_APPROVAL", event.getEventPayload())
});

proposalEventHandler.register(DOMAIN_EVENT.PROPOSAL_RESOLVED, async (event) => {
  console.log("CHAIN_PROPOSAL.PROPOSAL_RESOLVED", event.getEventPayload())
  const {
    proposal_id: proposalIdBuffer,
    state //??? 
  } = event.getEventPayload();

  const proposalId = Buffer.from(proposalIdBuffer).toString('hex');
  const proposal = await proposalService.getProposal(proposalId);
  if (!proposal) {
    logWarn(`Proposal ${proposalId} not found`);
    return;
  }
});

proposalEventHandler.register(DOMAIN_EVENT.PROPOSAL_EXPIRED, async (event) => {
  console.log("CHAIN_PROPOSAL.PROPOSAL EXPIRED", event.getEventPayload())
  const {
    proposal_id: proposalIdBuffer,
  } = event.getEventPayload();

  const proposalId = Buffer.from(proposalIdBuffer).toString('hex');

  const proposal = await proposalService.getProposal(proposalId);
  if (!proposal) {
    logWarn(`Proposal ${proposalId} not found`);
    return;
  }

  if (proposal.status !== ProposalStatus.EXPIRED) {
    await proposalService.updateProposal(proposalId, { status: ProposalStatus.EXPIRED, });
  }
});

module.exports = proposalEventHandler;
