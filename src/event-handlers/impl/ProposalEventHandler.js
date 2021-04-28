import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import APP_PROPOSAL_EVENT from './../../events/base/AppProposalEvent';
import ProposalDtoService from './../../services/impl/read/ProposalDtoService';
import TeamDtoService from './../../services/researchGroup'; // TODO: separate read/write schema

class ProposalEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const proposalEventHandler = new ProposalEventHandler();

const proposalDtoService = new ProposalDtoService();
const teamDtoService = new TeamDtoService();


proposalEventHandler.register(APP_EVENT.PROPOSAL_CREATED, async (event, ctx) => {
  const { proposalId, requiredApprovals, proposalCmd, type } = event.getEventPayload();

  // This handler should be replaced with handlers for multisig transactions below

  // Currently this collection includes 'personal' spaces that are being created for every standalone user.
  // We should replace this call after removing 'personal' spaces from domain logic
  const teams = await teamDtoService.getResearchGroups(requiredApprovals);
  const multiTenantIds = teams.reduce((acc, item) => {
    return acc.some(id => id == item.tenantId) ? acc : [...acc, item.tenantId];
  }, []);

  let details = {}; // TEMP support for legacy 'details' field, must be removed after schema separation
  const ProposalTypedEvent = APP_PROPOSAL_EVENT[type];
  if (ProposalTypedEvent) {
    const proposedCmds = proposalCmd.getProposedCmds();
    const typedEvent = new ProposalTypedEvent({
      proposalCmd: proposalCmd,
      proposalCtx: { proposalId, type, proposedCmds }
    });
    details = typedEvent.getEventPayload();
  } 

  await proposalDtoService.createProposalDto(proposalId, {
    type: type,
    details: details,
    multiTenantIds: multiTenantIds
  });
  
});



proposalEventHandler.register(APP_EVENT.PROJECT_INVITE_CREATED, async (event, ctx) => {
  // TODO: create multisig transaction read schema
});

proposalEventHandler.register(APP_EVENT.PROJECT_PROPOSAL_CREATED, async (event, ctx) => {
  // TODO: create multisig transaction read schema
});

proposalEventHandler.register(APP_EVENT.PROPOSAL_SIGNATURES_UPDATED, async (event, ctx) => {
  // TODO: handle proposal read schema
});



module.exports = proposalEventHandler;