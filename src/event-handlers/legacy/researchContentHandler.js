import EventEmitter from 'events';
import { LEGACY_APP_EVENTS, PROPOSAL_STATUS, RESEARCH_CONTENT_STATUS } from './../../constants';
import { handle, fire, wait } from './utils';
import ResearchService from './../../services/research';
import ProposalService from './../../services/proposal';
import ResearchGroupService from './../../services/researchGroup';
import ResearchContentService from './../../services/researchContent';


class ResearchContentHandler extends EventEmitter { }

const researchContentHandler = new ResearchContentHandler();

researchContentHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentCreatedEvent, tenant } = source;

  const researchService = new ResearchService();
  const researchGroupService = new ResearchGroupService();
  const researchContentService = new ResearchContentService();

  const { researchContentExternalId, researchExternalId, researchGroupExternalId, hash, references, authors, source: { offchain: { title, folder, algo, packageFiles, foreignReferences, type } } } = researchContentCreatedEvent.getSourceData();
  const research = await researchService.getResearch(researchExternalId);

  const researchContent = await researchContentService.createResearchContentRef({
    externalId: researchContentExternalId,
    researchExternalId,
    researchGroupExternalId,
    folder,
    researchId: research.id, // legacy internal id
    title,
    hash,
    algo,
    type,
    status: RESEARCH_CONTENT_STATUS.PUBLISHED,
    packageFiles,
    authors,
    references,
    foreignReferences
  });

  return researchContent;
}));


researchContentHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentCreatedEvent, tenant } = source;

  const researchService = new ResearchService();
  const researchGroupService = new ResearchGroupService();
  const researchContentService = new ResearchContentService();

  const { researchContentExternalId, researchExternalId, researchGroupExternalId, hash, references, authors, source: { offchain: { title, folder, algo, packageFiles, foreignReferences, type } } } = researchContentCreatedEvent.getSourceData();
  const research = await researchService.getResearch(researchExternalId);

  const researchContent = await researchContentService.createResearchContentRef({
    externalId: researchContentExternalId,
    researchExternalId,
    researchGroupExternalId,
    folder,
    researchId: research.id, // legacy internal id
    title,
    hash,
    algo,
    type,
    status: RESEARCH_CONTENT_STATUS.PROPOSED,
    packageFiles,
    authors,
    references,
    foreignReferences
  });

  return researchContent;
}));


researchContentHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentProposalSignedEvent, tenant } = source;

  const proposalsService = new ProposalService();
  const researchContentService = new ResearchContentService();

  const proposalId = researchContentProposalSignedEvent.getProposalId();
  const proposal = await proposalsService.getProposal(proposalId);

  const { status } = proposal.proposal;
  const { researchContentExternalId } = proposal.details;

  if (status == PROPOSAL_STATUS.APPROVED) {
    await researchContentService.updateResearchContentRef(researchContentExternalId, { 
      status: RESEARCH_CONTENT_STATUS.PUBLISHED 
    });
  }
}));



export default researchContentHandler;