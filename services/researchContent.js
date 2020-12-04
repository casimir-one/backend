import deipRpc from '@deip/rpc-client';
import ResearchContent from './../schemas/researchContent';
import { RESEARCH_CONTENT_STATUS } from './../constants';


class ResearchContentService {

  constructor() { }

  async findResearchContents(list) {
    let result = await ResearchContent.find({ _id: { $in: list } });
    return result;
  }

  async findPublishedResearchContent() {
    let result = await ResearchContent.find({ status: RESEARCH_CONTENT_STATUS.PUBLISHED });
    return result;
  }

  async findDraftResearchContent() {
    let result = await ResearchContent.find({ $or: [{ status: RESEARCH_CONTENT_STATUS.IN_PROGRESS }, { status: RESEARCH_CONTENT_STATUS.PROPOSED }] });
    return result;
  }

  async findPublishedResearchContentByResearch(researchExternalId) {
    let result = await ResearchContent.find({ researchExternalId, status: RESEARCH_CONTENT_STATUS.PUBLISHED });
    return result;
  }

  async findDraftResearchContentByResearch(researchExternalId) {
    let result = await ResearchContent.find({ researchExternalId, $or: [{ status: RESEARCH_CONTENT_STATUS.IN_PROGRESS }, { status: RESEARCH_CONTENT_STATUS.PROPOSED }] });
    return result;
  }

  async findResearchContentById(externalId) {
    let result = await ResearchContent.findOne({ _id: externalId });
    return result;
  }

  async removeResearchContentById(externalId) {
    let result = await ResearchContent.deleteOne({ _id: externalId });
    return result;
  }

  async findResearchContentByHash(researchExternalId, hash) {
    const rc = await ResearchContent.findOne({ researchExternalId, hash });
    return rc;
  }

  async removeResearchContentByHash(researchExternalId, hash) {
    const result = await ResearchContent.deleteOne({ researchExternalId, hash });
    return result;
  }

  async findResearchContentByResearchId(researchExternalId) {
    const list = await ResearchContent.find({ researchExternalId });
    return list;
  }

  async createResearchContent({
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


  async updateResearchContent(externalId, {
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

    const researchContent = await ResearchContent.findOne({ _id: externalId });

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


  async lookupContentProposal(researchGroup, hash) {
    const proposals = await deipRpc.api.getProposalsByCreatorAsync(researchGroup);
    const content = proposals.find(p => {
      const [op_name, op_payload] = p['proposed_transaction']['operations'][0];
      let tag = deipRpc.operations.getOperationTag(op_name);
      return tag == deipRpc.operations.getOperationTag("create_research_content") && op_payload.content == hash;
    });
    return content;
  }

  proposalIsNotExpired(proposal) { return proposal != null; }

}

export default ResearchContentService;