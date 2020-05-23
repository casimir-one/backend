import deipRpc from '@deip/rpc-client';
import ResearchContent from './../schemas/researchContent';
import { PROPOSAL_TYPE, RESEARCH_CONTENT_STATUS } from './../constants';


async function findPublishedResearchContent() {
  let researches = await ResearchContent.find({ status: RESEARCH_CONTENT_STATUS.PUBLISHED });
  return researches;
}

async function findDraftResearchContent() {
  let researches = await ResearchContent.find({ $or: [{ status: RESEARCH_CONTENT_STATUS.IN_PROGRESS }, { status: RESEARCH_CONTENT_STATUS.PROPOSED }] });
  return researches;
}

async function findPublishedResearchContentByResearch(researchExternalId) {
  let researches = await ResearchContent.find({ researchExternalId, status: RESEARCH_CONTENT_STATUS.PUBLISHED });
  return researches;
}

async function findDraftResearchContentByResearch(researchExternalId) {
  let researches = await ResearchContent.find({ researchExternalId, $or: [{ status: RESEARCH_CONTENT_STATUS.IN_PROGRESS }, { status: RESEARCH_CONTENT_STATUS.PROPOSED }] });
  return researches;
}

async function findResearchContentById(externalId) {
  let research = await ResearchContent.findOne({ _id: externalId });
  return research;
}

async function removeResearchContentById(externalId) {
  let result = await ResearchContent.deleteOne({ _id: externalId });
  return result;
}

async function findResearchContentByHash(researchExternalId, hash) {
    const rc = await ResearchContent.findOne({ researchExternalId, hash });
    return rc;
}

async function removeResearchContentByHash(researchExternalId, hash) {
  const result = await ResearchContent.deleteOne({ researchExternalId, hash });
  return result;
}

async function findResearchContentByResearchId(researchExternalId) {
  const list = await ResearchContent.find({ researchExternalId });
  return list;
}

async function createResearchContent({
  externalId,
  researchExternalId,
  researchGroupExternalId,
  folder,
  researchId, // legacy internal id
  researchGroupId, // legacy internal id
  title,
  hash,
  algo,
  type,
  status,
  packageFiles,
  authors,
  references,
  foreignReferences
}) {

  const researchContent = new ResearchContent({
    _id: externalId,
    researchExternalId,
    researchGroupExternalId,
    folder,
    researchId, // legacy internal id
    researchGroupId, // legacy internal id
    title,
    hash,
    algo,
    type,
    status,
    packageFiles,
    authors,
    references,
    foreignReferences
  });

  return researchContent.save();
}


async function updateResearchContent(externalId, {
  folder,
  title,
  hash,
  algo,
  type,
  status,
  packageFiles,
  authors,
  references,
  foreignReferences
}) {

  const researchContent = await findResearchContentById(externalId);

  researchContent.folder = folder;
  researchContent.title = title;
  researchContent.hash = hash;
  researchContent.algo = algo;
  researchContent.type = type;
  researchContent.status = status;
  researchContent.packageFiles = packageFiles;
  researchContent.authors = authors;
  researchContent.references = references;
  researchContent.foreignReferences = foreignReferences;

  return researchContent.save();
}


async function lookupContentProposal(researchGroup, hash) {
  const proposals = await deipRpc.api.getProposalsByCreatorAsync(researchGroup);
  const content = proposals.find(p => {
    const [op_name, op_payload] = p['proposed_transaction']['operations'][0];
    let tag = deipRpc.operations.getOperationTag(op_name);
    return tag == PROPOSAL_TYPE.CREATE_RESEARCH_MATERIAL && op_payload.content == hash;
  });
  return content;
}

function proposalIsNotExpired(proposal) {
  return proposal != null;
}

export {
  findResearchContentById,
  findResearchContentByHash,
  createResearchContent,
  updateResearchContent,
  removeResearchContentById,
  removeResearchContentByHash,
  findResearchContentByResearchId,
  lookupContentProposal,
  proposalIsNotExpired,
  findPublishedResearchContent,
  findDraftResearchContent,
  findPublishedResearchContentByResearch,
  findDraftResearchContentByResearch,
}