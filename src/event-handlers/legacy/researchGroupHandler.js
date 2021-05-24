import EventEmitter from 'events';
import { LEGACY_APP_EVENTS, PROPOSAL_STATUS } from './../../constants';
import { handle, fire, wait } from './utils';
import { TeamService, TeamDtoService } from './../../services';
import ProposalService from './../../services/impl/read/ProposalDtoService';

class ResearchGroupHandler extends EventEmitter { }

const researchGroupHandler = new ResearchGroupHandler();


researchGroupHandler.on(LEGACY_APP_EVENTS.RESEARCH_GROUP_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupCreatedEvent, tenant } = source;

  const teamService = new TeamService();
  const teamDtoService = new TeamDtoService();
  const { researchGroupExternalId, creator, source: { offchain: { attributes } } } = researchGroupCreatedEvent.getSourceData();

  await teamService.createTeam({
    externalId: researchGroupExternalId,
    creator: creator,
    attributes: attributes
  });

  const researchGroup = await teamDtoService.getTeam(researchGroupExternalId);
  return researchGroup;
}));


researchGroupHandler.on(LEGACY_APP_EVENTS.RESEARCH_GROUP_UPDATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdatedEvent, tenant } = source;

  const teamService = new TeamService();
  const teamDtoService = new TeamDtoService();
  const { researchGroupExternalId, source: { offchain: { attributes } } } = researchGroupUpdatedEvent.getSourceData();

  await teamService.updateTeam({
    externalId: researchGroupExternalId,
    attributes: attributes
  });

  const researchGroup = await teamDtoService.getTeam(researchGroupExternalId);
  return researchGroup;
}));


researchGroupHandler.on(LEGACY_APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdateProposalSignedEvent, tenant } = source;

  const teamService = new TeamService();
  const teamDtoService = new TeamDtoService();
  const proposalsService = new ProposalService();

  const proposalId = researchGroupUpdateProposalSignedEvent.getProposalId();

  const proposal = await proposalsService.getProposal(proposalId);
  const { status } = proposal.proposal;
  const { researchGroupExternalId, source: { offchain: { attributes } } } = proposal.details;

  if (status == PROPOSAL_STATUS.APPROVED) {
    await teamService.updateTeam(researchGroupExternalId, {
      attributes
    });
  }

  const researchGroup = await teamDtoService.getTeam(researchGroupExternalId);
  return researchGroup;
}));



export default researchGroupHandler;