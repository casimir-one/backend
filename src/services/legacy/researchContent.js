import deipRpc from '@deip/rpc-client';
import BaseService from './../base/BaseService';
import ProjectContentSchema from './../../schemas/write/ProjectContentSchema';
import { RESEARCH_CONTENT_STATUS, CONTENT_TYPES_MAP } from './../../constants';
import ResearchService from './../impl/read/ProjectDtoService';
import ResearchGroupService from './researchGroup';
import UsersService from './users';

class ResearchContentService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ProjectContentSchema, options);
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
    if (!researchContents.length) return [];
    const result = await this.mapResearchContents(researchContents);
    return result;
  }

  async lookupResearchContents() {
    const researchContents = await this.findMany({ status: RESEARCH_CONTENT_STATUS.PUBLISHED });
    if (!researchContents.length) return [];
    const result = await this.mapResearchContents(researchContents);
    return result;
  }

  async getResearchContentsByResearch(researchExternalId) {
    const researchContents = await this.findMany({ researchExternalId , status: RESEARCH_CONTENT_STATUS.PUBLISHED });
    if (!researchContents.length) return [];
    const result = await this.mapResearchContents(researchContents);
    return result;
  }

  async getResearchContentsByTenant(tenantId) {
    const available = await this.findMany({ status: RESEARCH_CONTENT_STATUS.PUBLISHED });
    const researchContents = available.filter(r => r.tenantId == tenantId);
    if (!researchContents.length) return [];
    const result = await this.mapResearchContents(researchContents);
    return result;
  }

  async findPublishedResearchContentRefsByResearch(researchExternalId) {
    const result = await this.findMany({ researchExternalId, status: RESEARCH_CONTENT_STATUS.PUBLISHED });
    return result;
  }

  async findDraftResearchContentRefsByResearch(researchExternalId) {
    const result = await this.findMany({ researchExternalId, status: { $in: [ RESEARCH_CONTENT_STATUS.IN_PROGRESS, RESEARCH_CONTENT_STATUS.PROPOSED ] } });
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

  async getResearchContentReferencesGraph(researchContentId) {
    const researchService = new ResearchService();
    const researchGroupService = new ResearchGroupService();
    const usersService = new UsersService();

    const researchContent = await this.getResearchContent(researchContentId);
    const research = await researchService.getResearch(researchContent.research_external_id);
    const researchGroup = await researchGroupService.getResearchGroup(research.research_group.external_id);

    const ref = await this.getResearchContentRef(researchContent.external_id);

    const authorsProfiles = await usersService.getUsers(researchContent.authors);

    const root = {
      isRoot: true,
      refType: 'root',
      researchContent: { ...researchContent, authorsProfiles },
      research,
      researchGroup,
      ref,
      contentType: this.getResearchContentType(researchContent.content_type)
    };

    const outerReferences = [];
    await this.getResearchContentOuterReferences(researchContent, outerReferences);

    const innerReferences = [];
    await this.getResearchContentInnerReferences(researchContent, innerReferences);

    const references = [...innerReferences, root, ...outerReferences];
    const nodes = references.reduce((acc, ref) => {
      if (acc.some((r) => r.researchContent.external_id === ref.researchContent.external_id)) {
        return acc;
      }
      return [...acc, ref];
    }, []);

    const links = [];
    for (let i = 0; i < references.length; i++) {
      const ref = references[i];

      if (ref.isRoot) continue;

      const type = ref.isOuter ? 'needs' : 'depends';

      const source = nodes.findIndex((node) => (ref.isOuter
        ? node.researchContent.external_id === ref.researchContent.external_id
        : node.researchContent.external_id === ref.to));

      const target = nodes.findIndex((node) => (ref.isOuter
        ? node.researchContent.external_id === ref.to
        : node.researchContent.external_id === ref.researchContent.external_id));

      const link = { source, target, type };

      links.push(link);
    }

    return { nodes, links };
  }

  async getResearchContentOuterReferences(researchContent, acc) {
    const researchService = new ResearchService();
    const researchGroupService = new ResearchGroupService();
    const usersService = new UsersService();

    const outerReferences = await deipRpc.api.getContentsReferToContent2Async(researchContent.external_id);

    for (let i = 0; i < outerReferences.length; i++) {
      const item = outerReferences[i];
      const {
        trx_id, block, timestamp, op
      } = item;
      const [opName, payload] = op;

      const {
        research_external_id: researchExternalId,
        research_content_external_id: researchContentExternalId,
        research_reference_external_id: referenceResearchExternalId,
        research_content_reference_external_id: referenceResearchContentExternalId
      } = payload;

      const outerRefResearch = await researchService.getResearch(researchExternalId);
      if (!outerRefResearch) {
        continue; // deleted research\content
      }
      const outerRefResearchGroup = await researchGroupService.getResearchGroup(outerRefResearch.research_group.external_id);
      const outerRefResearchContent = await this.getResearchContent(researchContentExternalId);

      const ref = await this.getResearchContentRef(outerRefResearchContent.external_id);

      const authorsProfiles = await usersService.getUsers(outerRefResearchContent.authors);

      acc.push({
        isOuter: true,
        refType: 'out',
        to: referenceResearchContentExternalId,
        researchGroup: outerRefResearchGroup,
        research: outerRefResearch,
        researchContent: { ...outerRefResearchContent, authorsProfiles },
        ref,
        contentType: this.getResearchContentType(outerRefResearchContent.content_type)
      });

      await this.getResearchContentOuterReferences(outerRefResearchContent, acc);
    }
  }

  async getResearchContentInnerReferences(researchContent, acc) {
    const researchService = new ResearchService();
    const researchGroupService = new ResearchGroupService();
    const usersService = new UsersService();

    const innerReferences = await deipRpc.api.getContentReferences2Async(researchContent.external_id);

    for (let i = 0; i < innerReferences.length; i++) {
      const item = innerReferences[i];
      const {
        trx_id, block, timestamp, op
      } = item;
      const [opName, payload] = op;

      const {
        research_external_id: researchExternalId,
        research_content_external_id: researchContentExternalId,
        research_reference_external_id: referenceResearchExternalId,
        research_content_reference_external_id: referenceResearchContentExternalId
      } = payload;

      const innerRefResearch = await researchService.getResearch(referenceResearchExternalId);
      if (!innerRefResearch) {
        continue; // deleted research\content
      }
      
      const innerRefResearchGroup = await researchGroupService.getResearchGroup(innerRefResearch.research_group.external_id);
      const innerRefResearchContent = await this.getResearchContent(referenceResearchContentExternalId);

      const ref = await this.getResearchContentRef(innerRefResearchContent.external_id);

      const authorsProfiles = await usersService.getUsers(innerRefResearchContent.authors);

      acc.push({
        isInner: true,
        refType: 'in',
        to: researchContentExternalId,
        researchGroup: innerRefResearchGroup,
        research: innerRefResearch,
        researchContent: { ...innerRefResearchContent, authorsProfiles },
        ref,
        contentType: this.getResearchContentType(innerRefResearchContent.content_type)
      });
      await this.getResearchContentInnerReferences(innerRefResearchContent, acc);
    }
  }

  getResearchContentType(type) {
    return CONTENT_TYPES_MAP.find((t) => t.type === type);
  }

}

export default ResearchContentService;