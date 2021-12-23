import ProjectDtoService from './ProjectDtoService';
import TeamDtoService from './TeamDtoService';
import UserDtoService from './UserDtoService';
import { CONTENT_TYPES_MAP } from '../../../constants';
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

  async mapProjectContents(projectsContents) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const chainProjectsContents = await chainRpc.getProjectContentsAsync(projectsContents.map(c => c._id));

    return projectsContents.map((projectContent) => {
      const chainProjectContent = chainProjectsContents.find((chainProjectContent) => !!chainProjectContent && chainProjectContent.contentId == projectContent._id);
      
      let metadata = null;
      let eciMap = {};
      if (chainProjectContent) {
        metadata = chainProjectContent.metadata;
        eciMap = chainProjectContent.eciMap;
      } else {
        console.warn(`Project content with ID '${projectContent._id}' is not found in the Chain`);
      }

      return {
        _id: projectContent._id,
        portalId: projectContent.portalId,
        projectId: projectContent.projectId,
        teamId: projectContent.teamId,
        title: projectContent.title,
        folder: projectContent.folder,
        authors: projectContent.authors,
        hash: projectContent.hash,
        algo: projectContent.algo,
        type: projectContent.type,
        status: projectContent.status,
        packageFiles: projectContent.packageFiles,
        references: projectContent.references,
        foreignReferences: projectContent.foreignReferences,
        createdAt: projectContent.createdAt || projectContent.created_at,
        updatedAt: projectContent.updatedAt || projectContent.updated_at,
        metadata: metadata,
        eciMap: eciMap,
        contentType: projectContent.contentType,
        formatType: projectContent.formatType,
        
        
        // @deprecated
        // external_id: projectContent._id,
        // project_external_id: projectContent.projectId,
        content: projectContent.hash,
        description: metadata,
        projectContentRef: projectContent,
        eci_per_domain: eciMap,
        created_at: projectContent.createdAt || projectContent.created_at
      };
    });
  }

  async getProjectContent(projectContentId) {
    const projectContent = await this.findOne({ _id: projectContentId });
    if (!projectContent) return null;
    const [result] = await this.mapProjectContents([projectContent]);
    return result;
  }


  async getProjectContents(projectContentIds) {
    const projectContents = await this.findMany({ _id: { $in: [...projectContentIds] } });
    if (!projectContents.length) return [];
    const result = await this.mapProjectContents(projectContents);
    return result;
  }

  async lookupProjectContents() {
    const projectContents = await this.findMany({});
    if (!projectContents.length) return [];
    const result = await this.mapProjectContents(projectContents);
    return result;
  }

  async getProjectContentsByProject(projectId) {
    const projectContents = await this.findMany({ projectId: projectId });
    if (!projectContents.length) return [];
    const result = await this.mapProjectContents(projectContents);
    return result;
  }

  async getProjectContentsByPortal(portalId) {
    const available = await this.findMany({});
    const projectContents = available.filter(r => r.portalId == portalId);
    if (!projectContents.length) return [];
    const result = await this.mapProjectContents(projectContents);
    return result;
  }

  async findPublishedProjectContentRefsByProject(projectId) {
    const result = await this.findMany({ projectId: projectId });
    return result;
  }

  async getProjectContentRef(projectId) {
    const result = await this.findOne({ _id: projectId });
    return result;
  }

  async findProjectContentRefByHash(projectId, hash) {
    const result = await this.findOne({ projectId: projectId, hash });
    return result;
  }

  async getProjectContentReferencesGraph(projectContentId) {
    const projectContent = await this.getProjectContent(projectContentId);
    const project = await projectDtoService.getProject(projectContent.projectId);
    const team = await teamDtoService.getTeam(project.teamId);

    const ref = await this.getProjectContentRef(projectContent._id);

    const authorsProfiles = await userDtoService.getUsers(projectContent.authors);

    const root = {
      isRoot: true,
      refType: 'root',
      projectContent: { ...projectContent, authorsProfiles },
      project,
      team,
      ref,
      contentType: this.getProjectContentType(projectContent.content_type)
    };

    const outerReferences = [];
    await this.getProjectContentOuterReferences(projectContent, outerReferences);

    const innerReferences = [];
    await this.getProjectContentInnerReferences(projectContent, innerReferences);

    const references = [...innerReferences, root, ...outerReferences];
    const nodes = references.reduce((acc, ref) => {
      if (acc.some((r) => r.projectContent._id === ref.projectContent._id)) {
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
        ? node.projectContent._id === ref.projectContent._id
        : node.projectContent._id === ref.to));

      const target = nodes.findIndex((node) => (ref.isOuter
        ? node.projectContent._id === ref.to
        : node.projectContent._id === ref.projectContent._id));

      const link = { source, target, type };

      links.push(link);
    }

    return { nodes, links };
  }

  async getProjectContentOuterReferences(projectContent, acc) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const outerReferences = await chainRpc.getContentsReferToContent2Async(projectContent._id);

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

      const outerRefProject = await projectDtoService.getProject(projectId);
      if (!outerRefProject) {
        continue; // deleted project\content
      }
      const outerRefTeam = await teamDtoService.getTeam(outerRefProject.teamId);
      const outerRefProjectContent = await this.getProjectContent(projectContentId);

      const ref = await this.getProjectContentRef(outerRefProjectContent._id);

      const authorsProfiles = await userDtoService.getUsers(outerRefProjectContent.authors);

      acc.push({
        isOuter: true,
        refType: 'out',
        to: referenceprojectContentId,
        team: outerRefTeam,
        project: outerRefProject,
        projectContent: { ...outerRefProjectContent, authorsProfiles },
        ref,
        contentType: this.getProjectContentType(outerRefProjectContent.content_type)
      });

      await this.getProjectContentOuterReferences(outerRefProjectContent, acc);
    }
  }

  async getProjectContentInnerReferences(projectContent, acc) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const innerReferences = await chainRpc.getContentReferences2Async(projectContent._id);

    for (let i = 0; i < innerReferences.length; i++) {
      const item = innerReferences[i];
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

      const innerRefProject = await projectDtoService.getProject(referenceProjectId);
      if (!innerRefProject) {
        continue; // deleted project\content
      }
      
      const innerRefTeam = await teamDtoService.getTeam(innerRefProject.teamId);
      const innerRefProjectContent = await this.getProjectContent(referenceprojectContentId);

      const ref = await this.getProjectContentRef(innerRefProjectContent._id);

      const authorsProfiles = await userDtoService.getUsers(innerRefProjectContent.authors);

      acc.push({
        isInner: true,
        refType: 'in',
        to: projectContentId,
        team: innerRefTeam,
        project: innerRefProject,
        projectContent: { ...innerRefProjectContent, authorsProfiles },
        ref,
        contentType: this.getProjectContentType(innerRefProjectContent.content_type)
      });
      await this.getProjectContentInnerReferences(innerRefProjectContent, acc);
    }
  }

  getProjectContentType(type) {
    return CONTENT_TYPES_MAP.find((t) => t.type === type || t.id === type);
  }
 
}

export default ProjectContentDtoService;