import EventEmitter from 'events';
import { APP_EVENTS, PROPOSAL_STATUS, SMART_CONTRACT_TYPE, RESEARCH_CONTENT_STATUS } from './../constants';
import { handle, fire, wait } from './utils';
import ResearchService from './../services/research';
import ProposalService from './../services/proposal';
import ResearchGroupService from './../services/researchGroup';
import ResearchContentService from './../services/researchContent';
import usersService from './../services/users';


class ResearchContentHandler extends EventEmitter { }

const researchContentHandler = new ResearchContentHandler();

researchContentHandler.on(APP_EVENTS.RESEARCH_CONTENT_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentCreatedEvent, tenant } = source;

  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();
  const researchContentService = new ResearchContentService();

  const { researchContentExternalId } = researchContentCreatedEvent.getSourceData();

  const researchContent = await researchContentService.findResearchContentById(researchContentExternalId)
  const researchContentData = researchContent.toObject();

  const update = { status: RESEARCH_CONTENT_STATUS.PUBLISHED };
  await researchContentService.updateResearchContent(researchContentExternalId, {
    ...researchContentData,
    ...update
  });

}));


researchContentHandler.on(APP_EVENTS.RESEARCH_CONTENT_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentProposalSignedEvent, tenant } = source;

  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();
  const proposalsService = new ProposalService(usersService, researchGroupService, researchService);
  const researchContentService = new ResearchContentService();

  const proposalId = researchContentProposalSignedEvent.getProposalId();
  const proposal = await proposalsService.getProposal(proposalId);

  const { status } = proposal.proposal;
  const { researchContentExternalId } = proposal.details;

  const researchContent = await researchContentService.findResearchContentById(researchContentExternalId)
  const researchContentData = researchContent.toObject();

  if (status == PROPOSAL_STATUS.APPROVED) {
    const update = { status: RESEARCH_CONTENT_STATUS.PUBLISHED };
    await researchContentService.updateResearchContent(researchContentExternalId, {
      ...researchContentData,
      ...update
    });
  }
}));



export default researchContentHandler;