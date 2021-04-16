import EventEmitter from 'events';
import { APP_EVENTS, PROPOSAL_STATUS } from './../../constants';
import { handle, fire, wait } from './utils';
import ResearchGroupService from './../../services/researchGroup';
import ProposalService from './../../services/proposal';

class ResearchGroupHandler extends EventEmitter { }

const researchGroupHandler = new ResearchGroupHandler();


researchGroupHandler.on(APP_EVENTS.RESEARCH_GROUP_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupCreatedEvent, tenant } = source;

  const researchGroupsService = new ResearchGroupService();
  const { researchGroupExternalId, creator, source: { offchain: { name, description } } } = researchGroupCreatedEvent.getSourceData();

  await researchGroupsService.createResearchGroupRef({
    externalId: researchGroupExternalId,
    creator: creator,
    name: name,
    description: description
  });

  const researchGroup = await researchGroupsService.getResearchGroup(researchGroupExternalId);
  return researchGroup;
}));


researchGroupHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdatedEvent, tenant } = source;

  const researchGroupsService = new ResearchGroupService();
  const { researchGroupExternalId, source: { offchain: { name, description } } } = researchGroupUpdatedEvent.getSourceData();

  await researchGroupsService.updateResearchGroupRef({
    externalId: researchGroupExternalId,
    name: name,
    description: description
  });

  const researchGroup = await researchGroupsService.getResearchGroup(researchGroupExternalId);
  return researchGroup;
}));


researchGroupHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdateProposalSignedEvent, tenant } = source;

  const researchGroupService = new ResearchGroupService();
  const proposalsService = new ProposalService();

  const proposalId = researchGroupUpdateProposalSignedEvent.getProposalId();

  const proposal = await proposalsService.getProposal(proposalId);
  const { status } = proposal.proposal;
  const { researchGroupExternalId, source: { offchain: { name, description } } } = proposal.details;

  if (status == PROPOSAL_STATUS.APPROVED) {
    await researchGroupService.updateResearchGroupRef(researchGroupExternalId, {
      name: name,
      description: description
    });
  }

  const researchGroup = await researchGroupsService.getResearchGroup(researchGroupExternalId);
  return researchGroup;
}));



export default researchGroupHandler;