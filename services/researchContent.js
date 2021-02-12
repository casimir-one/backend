import deipRpc from '@deip/rpc-client';
import BaseReadModelService from './base';
import ResearchContent from './../schemas/researchContent';
import { RESEARCH_CONTENT_STATUS } from './../constants';


class ResearchContentService extends BaseReadModelService {

  constructor() { 
    super(ResearchContent);
  }

  async mapResearchContents(researchContents) {
    const chainResearchContents = await deipRpc.api.getResearchContentsAsync(researchContents.map(rc => rc._id));
    
    return chainResearchContents
      .map((chainResearchContent) => {
        const researchContentRef = researchContents.find(rc => rc._id == chainResearchContent.external_id);
        return { ...chainResearchContent, researchContentRef: researchContentRef ? researchContentRef : null };
      })
      .map((researchContent) => {
        const override = researchContent.researchContentRef ? { title: researchContent.researchContentRef.title } : { title: "Not specified" };
        return { ...researchContent, ...override };
      });
  }

  async getResearchContent(researchContentExternalId) {
    const researchContent = await this.findOne({ _id: researchContentExternalId, status: RESEARCH_CONTENT_STATUS.PUBLISHED });
    if (!researchContent) return null;
    const [result] = await this.mapResearchContents([researchContent]);
    return result;
  }


  async getResearchContents(researchContentExternalIds) {
    const researchContents = await this.findMany({ _id: { $in: [...researchContentExternalIds] }, status: RESEARCH_CONTENT_STATUS.PUBLISHED });
    const result = await this.mapResearchContents(researchContents);
    return result;
  }

  async lookupResearchContents() {
    const researchContents = await this.findMany({ status: RESEARCH_CONTENT_STATUS.PUBLISHED });
    const result = await this.mapResearchContents(researchContents);
    return result;
  }

  async getResearchContentsByResearch(researchExternalId) {
    const researchContents = await this.findMany({ researchExternalId , status: RESEARCH_CONTENT_STATUS.PUBLISHED });
    const result = await this.mapResearchContents(researchContents);
    return result;
  }

  async getResearchContentsByTenant(tenantId) {
    const available = await this.findMany({ status: RESEARCH_CONTENT_STATUS.PUBLISHED });
    const researchContents = available.filter(r => r.tenantId == tenantId);
    const result = await this.mapResearchContents(researchContents);
    return result;
  }

  async findPublishedResearchContentRefsByResearch(researchExternalId) {
    const result = await this.findMany({ researchExternalId, status: RESEARCH_CONTENT_STATUS.PUBLISHED });
    return result;
  }

  async findDraftResearchContentRefsByResearch(researchExternalId) {
    const result = await this.findMany({ researchExternalId, $or: [{ status: RESEARCH_CONTENT_STATUS.IN_PROGRESS }, { status: RESEARCH_CONTENT_STATUS.PROPOSED }] });
    return result;
  }

  async getResearchContentRef(externalId) {
    const result = await this.findOne({ _id: externalId });
    return result;
  }

  async removeResearchContentRefById(externalId) {
    const result = await this.deleteOne({ _id: externalId });
    return result;
  }

  async findResearchContentRefByHash(researchExternalId, hash) {
    const result = await this.findOne({ researchExternalId, hash });
    return result;
  }

  async removeResearchContentRefByHash(researchExternalId, hash) {
    const result = await this.deleteOne({ researchExternalId, hash });
    return result;
  }

  async createResearchContentRef({
    externalId,
    researchExternalId,
    researchGroupExternalId,
    folder,
    researchId, // legacy internal id
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

    const result = await this.createOne({
      _id: externalId,
      researchExternalId,
      researchGroupExternalId,
      folder,
      researchId, // legacy internal id
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

    return result;
  }


  async updateResearchContentRef(externalId, {
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

    const result = await this.updateOne({ _id: externalId }, {
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
    });

    return result;
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