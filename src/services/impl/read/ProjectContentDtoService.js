import ProjectDtoService from './ProjectDtoService';
import TeamDtoService from './TeamDtoService';
import UserDtoService from './UserDtoService';
import { PROJECT_CONTENT_STATUS, CONTENT_TYPES_MAP } from '../../../constants';
import BaseService from '../../base/BaseService';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import ProjectContentSchema from './../../../schemas/ProjectContentSchema';


const projectDtoService = new ProjectDtoService();
const teamDtoService = new TeamDtoService();
const userDtoService = new UserDtoService();

class ProjectContentDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(ProjectContentSchema, options);
  }

  async mapProjectContents(projectContents) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const chainProjectContents = await chainApi.getProjectContentsAsync(projectContents.map(rc => rc._id));
    
    return chainProjectContents
      .map((chainProjectContent) => {
        const projectContentRef = projectContents.find(rc => rc._id == chainProjectContent.external_id);
        return { ...chainProjectContent, researchContentRef: projectContentRef ? projectContentRef : null };
      })
      .map((projectContent) => {
        const override = projectContent.researchContentRef ? { title: projectContent.researchContentRef.title } : { title: "Not specified" };
        return { ...projectContent, ...override };
      });
  }

  async getProjectContent(projectContentId) {
    const projectContent = await this.findOne({ _id: projectContentId, status: PROJECT_CONTENT_STATUS.PUBLISHED });
    if (!projectContent) return null;
    const [result] = await this.mapProjectContents([projectContent]);
    return result;
  }


  async getProjectContents(projectContentIds) {
    const projectContents = await this.findMany({ _id: { $in: [...projectContentIds] }, status: PROJECT_CONTENT_STATUS.PUBLISHED });
    if (!projectContents.length) return [];
    const result = await this.mapProjectContents(projectContents);
    return result;
  }

  async lookupProjectContents() {
    const projectContents = await this.findMany({ status: PROJECT_CONTENT_STATUS.PUBLISHED });
    if (!projectContents.length) return [];
    const result = await this.mapProjectContents(projectContents);
    return result;
  }

  async getProjectContentsByProject(projectId) {
    const projectContents = await this.findMany({ researchExternalId: projectId , status: PROJECT_CONTENT_STATUS.PUBLISHED });
    if (!projectContents.length) return [];
    const result = await this.mapProjectContents(projectContents);
    return result;
  }

  async getProjectContentsByTenant(tenantId) {
    const available = await this.findMany({ status: PROJECT_CONTENT_STATUS.PUBLISHED });
    const projectContents = available.filter(r => r.tenantId == tenantId);
    if (!projectContents.length) return [];
    const result = await this.mapProjectContents(projectContents);
    return result;
  }

  async findPublishedProjectContentRefsByProject(projectId) {
    const result = await this.findMany({ researchExternalId: projectId, status: PROJECT_CONTENT_STATUS.PUBLISHED });
    return result;
  }

  async findDraftProjectContentRefsByProject(projectId) {
    const result = await this.findMany({ researchExternalId: projectId, status: { $in: [ PROJECT_CONTENT_STATUS.IN_PROGRESS, PROJECT_CONTENT_STATUS.PROPOSED ] } });
    return result;
  }

  async getProjectContentRef(externalId) {
    const result = await this.findOne({ _id: externalId });
    return result;
  }

  async findProjectContentRefByHash(projectId, hash) {
    const result = await this.findOne({ researchExternalId: projectId, hash });
    return result;
  }

  async getProjectContentReferencesGraph(projectContentId) {
    const projectContent = await this.getProjectContent(projectContentId);
    const project = await projectDtoService.getResearch(projectContent.research_external_id);
    const team = await teamDtoService.getTeam(project.research_group.external_id);

    const ref = await this.getProjectContentRef(projectContent.external_id);

    const authorsProfiles = await userDtoService.getUsers(projectContent.authors);

    const root = {
      isRoot: true,
      refType: 'root',
      researchContent: { ...projectContent, authorsProfiles },
      research: project,
      researchGroup: team,
      ref,
      contentType: this.getProjectContentType(projectContent.content_type)
    };

    const outerReferences = [];
    await this.getProjectContentOuterReferences(projectContent, outerReferences);

    const innerReferences = [];
    await this.getProjectContentInnerReferences(projectContent, innerReferences);

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

  async getProjectContentOuterReferences(projectContent, acc) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const outerReferences = await chainApi.getContentsReferToContent2Async(projectContent.external_id);

    for (let i = 0; i < outerReferences.length; i++) {
      const item = outerReferences[i];
      const {
        trx_id, block, timestamp, op
      } = item;
      const [opName, payload] = op;

      const {
        research_external_id: projectId,
        research_content_external_id: projectContentId,
        research_reference_external_id: referenceProjectId,
        research_content_reference_external_id: referenceprojectContentId
      } = payload;

      const outerRefProject = await projectDtoService.getResearch(projectId);
      if (!outerRefProject) {
        continue; // deleted research\content
      }
      const outerRefTeam = await teamDtoService.getTeam(outerRefProject.research_group.external_id);
      const outerRefProjectContent = await this.getProjectContent(projectContentId);

      const ref = await this.getProjectContentRef(outerRefProjectContent.external_id);

      const authorsProfiles = await userDtoService.getUsers(outerRefProjectContent.authors);

      acc.push({
        isOuter: true,
        refType: 'out',
        to: referenceprojectContentId,
        researchGroup: outerRefTeam,
        research: outerRefProject,
        researchContent: { ...outerRefProjectContent, authorsProfiles },
        ref,
        contentType: this.getProjectContentType(outerRefProjectContent.content_type)
      });

      await this.getProjectContentOuterReferences(outerRefProjectContent, acc);
    }
  }

  async getProjectContentInnerReferences(projectContent, acc) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const innerReferences = await chainApi.getContentReferences2Async(projectContent.external_id);

    for (let i = 0; i < innerReferences.length; i++) {
      const item = innerReferences[i];
      const {
        trx_id, block, timestamp, op
      } = item;
      const [opName, payload] = op;

      const {
        research_external_id: projectId,
        research_content_external_id: projectContentId,
        research_reference_external_id: referenceProjectExternalId,
        research_content_reference_external_id: referenceprojectContentId
      } = payload;

      const innerRefProject = await projectDtoService.getResearch(referenceProjectExternalId);
      if (!innerRefProject) {
        continue; // deleted research\content
      }
      
      const innerRefTeam = await teamDtoService.getTeam(innerRefProject.research_group.external_id);
      const innerRefProjectContent = await this.getProjectContent(referenceprojectContentId);

      const ref = await this.getProjectContentRef(innerRefProjectContent.external_id);

      const authorsProfiles = await userDtoService.getUsers(innerRefProjectContent.authors);

      acc.push({
        isInner: true,
        refType: 'in',
        to: projectContentId,
        researchGroup: innerRefTeam,
        research: innerRefProject,
        researchContent: { ...innerRefProjectContent, authorsProfiles },
        ref,
        contentType: this.getProjectContentType(innerRefProjectContent.content_type)
      });
      await this.getProjectContentInnerReferences(innerRefProjectContent, acc);
    }
  }

  getProjectContentType(type) {
    return CONTENT_TYPES_MAP.find((t) => t.type === type);
  }
 
}

export default ProjectContentDtoService;