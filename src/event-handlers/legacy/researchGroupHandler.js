import EventEmitter from 'events';
import { LEGACY_APP_EVENTS, PROPOSAL_STATUS } from './../../constants';
import { handle, fire, wait } from './utils';
import ResearchGroupService from './../../services/legacy/researchGroup';
import ProposalService from './../../services/impl/read/ProposalDtoService';

class ResearchGroupHandler extends EventEmitter { }

const researchGroupHandler = new ResearchGroupHandler();


researchGroupHandler.on(LEGACY_APP_EVENTS.RESEARCH_GROUP_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupCreatedEvent, tenant } = source;

  const researchGroupService = new ResearchGroupService();
  const { researchGroupExternalId, creator, source: { offchain: { attributes } } } = researchGroupCreatedEvent.getSourceData();

  await researchGroupService.createResearchGroupRef({
    externalId: researchGroupExternalId,
    creator: creator,
    attributes: attributes
  });

  const researchGroup = await researchGroupService.getResearchGroup(researchGroupExternalId);
  return researchGroup;
}));


researchGroupHandler.on(LEGACY_APP_EVENTS.RESEARCH_GROUP_UPDATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdatedEvent, tenant } = source;

  const researchGroupService = new ResearchGroupService();
  const { researchGroupExternalId, source: { offchain: { attributes } } } = researchGroupUpdatedEvent.getSourceData();

  await researchGroupService.updateResearchGroupRef({
    externalId: researchGroupExternalId,
    attributes: attributes
  });

  const researchGroup = await researchGroupService.getResearchGroup(researchGroupExternalId);
  return researchGroup;
}));


researchGroupHandler.on(LEGACY_APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdateProposalSignedEvent, tenant } = source;

  const researchGroupService = new ResearchGroupService();
  const proposalsService = new ProposalService();

  const proposalId = researchGroupUpdateProposalSignedEvent.getProposalId();

  const proposal = await proposalsService.getProposal(proposalId);
  const { status } = proposal.proposal;
  const { researchGroupExternalId, source: { offchain: { attributes } } } = proposal.details;

  if (status == PROPOSAL_STATUS.APPROVED) {
    await researchGroupService.updateResearchGroupRef(researchGroupExternalId, {
      attributes
    });
  }

  const researchGroup = await researchGroupService.getResearchGroup(researchGroupExternalId);
  return researchGroup;
}));



export default researchGroupHandler;