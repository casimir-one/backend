import BaseEventHandler from './../base/BaseEventHandler';
import deipRpc from '@deip/rpc-client';
import APP_EVENT from './../../events/base/AppEvent';
import APP_PROPOSAL_EVENT from './../../events/base/AppProposalEvent';
import ProposalService from './../../services/impl/write/ProposalService';
import TeamDtoService from './../../services/legacy/researchGroup'; // TODO: separate read/write schema

class ProposalEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const proposalEventHandler = new ProposalEventHandler();

const proposalService = new ProposalService();
const teamDtoService = new TeamDtoService();


proposalEventHandler.register(APP_EVENT.PROPOSAL_CREATED, async (event) => {
  const { proposalId, creator, status, proposalCmd, type } = event.getEventPayload();

  // This handler should be replaced with handlers for multisig transactions below

  // Currently this collection includes 'personal' spaces that are being created for every standalone user.
  // We should replace this call after removing 'personal' spaces from domain logic
  const chainProposal = await deipRpc.api.getProposalStateAsync(proposalId);
  const teams = await teamDtoService.getResearchGroups(chainProposal.required_approvals);
  const multiTenantIds = teams.reduce((acc, item) => {
    return acc.some(id => id == item.tenantId) ? acc : [...acc, item.tenantId];
  }, []);

  let details = {}; // TEMP support for legacy 'details' field, must be removed after schema separation
  const ProposalCreatedHookEvent = APP_PROPOSAL_EVENT[type]['CREATED'];
  if (ProposalCreatedHookEvent) {
    const proposedCmds = proposalCmd.getProposedCmds();
    const typedEvent = new ProposalCreatedHookEvent({
      proposalCmd: proposalCmd,
      proposalCtx: { proposalId, type, proposedCmds }
    });
    details = typedEvent.getEventPayload();
  } 

  await proposalService.createProposal({
    proposalId: proposalId,
    proposalCmd: proposalCmd,
    status: status,
    type: type,
    details: details,
    multiTenantIds: multiTenantIds,
    creator: creator
  });
  
});

proposalEventHandler.register(APP_EVENT.PROPOSAL_UPDATED, async (event) => {
  const { proposalId, status } = event.getEventPayload();
  const proposal = await proposalService.updateProposal(proposalId, {
    status: status
  });
});

proposalEventHandler.register(APP_EVENT.PROPOSAL_DECLINED, async (event) => {
  const { proposalId, status } = event.getEventPayload();
  const proposal = await proposalService.updateProposal(proposalId, {
    status: status
  });
});

proposalEventHandler.register(APP_EVENT.PROJECT_INVITE_CREATED, async (event) => {
  // TODO: create multisig transaction read schema
});

proposalEventHandler.register(APP_EVENT.PROJECT_PROPOSAL_CREATED, async (event) => {
  // TODO: create multisig transaction read schema
});

proposalEventHandler.register(APP_EVENT.PROJECT_UPDATE_PROPOSAL_CREATED, async (event) => {
  // TODO: create multisig transaction read schema
});


module.exports = proposalEventHandler;