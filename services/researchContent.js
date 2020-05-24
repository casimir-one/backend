import deipRpc from '@deip/rpc-client';
import ResearchContent from './../schemas/researchContent';
import { PROPOSAL_TYPE, RESEARCH_CONTENT_STATUS } from './../constants';


async function findResearchContents(list) {
  let result = await ResearchContent.find({ _id: { $in: list } });
  return result;
}

async function findPublishedResearchContent() {
  let result = await ResearchContent.find({ status: RESEARCH_CONTENT_STATUS.PUBLISHED });
  return result;
}

async function findDraftResearchContent() {
  let result = await ResearchContent.find({ $or: [{ status: RESEARCH_CONTENT_STATUS.IN_PROGRESS }, { status: RESEARCH_CONTENT_STATUS.PROPOSED }] });
  return result;
}

async function findPublishedResearchContentByResearch(researchExternalId) {
  let result = await ResearchContent.find({ researchExternalId, status: RESEARCH_CONTENT_STATUS.PUBLISHED });
  return result;
}

async function findDraftResearchContentByResearch(researchExternalId) {
  let result = await ResearchContent.find({ researchExternalId, $or: [{ status: RESEARCH_CONTENT_STATUS.IN_PROGRESS }, { status: RESEARCH_CONTENT_STATUS.PROPOSED }] });
  return result;
}

async function findResearchContentById(externalId) {
  let result = await ResearchContent.findOne({ _id: externalId });
  return result;
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
  findResearchContents,
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