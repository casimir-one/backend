import BaseService from './../../base/BaseService';
import ProjectSchema from './../../../schemas/ProjectSchema'; // TODO: separate read/write schemas
import AttributeDtoService from './AttributeDtoService';
import AssetDtoService from './AssetDtoService';
import TeamDtoService from './TeamDtoService';
import ContractAgreementDtoService from './ContractAgreementDtoService';
import { PROJECT_ATTRIBUTE, PROJECT_STATUS } from './../../../constants';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import { CONTRACT_AGREEMENT_TYPE, ATTR_SCOPES, ATTR_TYPES } from '@deip/constants';


const teamDtoService = new TeamDtoService();

class ProjectDtoService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ProjectSchema, options);
  }


  async mapProjects(projects, filterObj) {
    const contractAgreementDtoService = new ContractAgreementDtoService();
    const attributeDtoService = new AttributeDtoService();
    const assetDtoService = new AssetDtoService();
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const filter = {
      searchTerm: "",
      projectAttributes: [],
      portalIds: [],
      isDefault: undefined,
      ...filterObj
    }

    const projectLicenses = await contractAgreementDtoService.getContractAgreements({ type: CONTRACT_AGREEMENT_TYPE.PROJECT_LICENSE });
    const projectAccesses = await contractAgreementDtoService.getContractAgreements({ type: CONTRACT_AGREEMENT_TYPE.PROJECT_ACCESS });
    const projectsAttributes = await attributeDtoService.getAttributesByScope(ATTR_SCOPES.PROJECT || 'project');
    const teams = await Promise.all(projects.map((project) => teamDtoService.getTeam(project.teamId)));
    const teamsMembers = teams.filter((team) => !!team).map((team) => ({ teamId: team._id, members: team.members }));

    const chainProjects = await chainRpc.getProjectsAsync(projects.map(p => p._id));
    const chainProjectNfts = await assetDtoService.getAssetsByProjects(projects.map(({ _id }) => _id));
    return projects.map((project) => {
      const teamMembers = teamsMembers.find((t) => t.teamId == project.teamId);
      const members = teamMembers ? teamMembers.members : [];

      const chainProject = chainProjects.find((chainProject) => chainProject && chainProject.projectId == project._id);

      let isPrivate;
      if (chainProject) {
        isPrivate = chainProject.isPrivate;
      } else {
        console.warn(`Project with ID '${project._id}' is not found in the Chain`);
      }

      const attributes = project.attributes || [];
      const expressLicenses = projectLicenses.filter(l => l.terms.projectId == project._id);
      const grantedAccess = projectAccesses.filter(a => a.terms.projectId == project._id).reduce((acc, contract) => {
        for (let i = 0; i < contract.parties.length; i++) {
          const party = contract.parties[i];
          if (!acc.includes(party))
            acc.push(party)
        }
        return acc;
      }, []);

      const nfts = chainProjectNfts
        .filter((chainProjectNft) => chainProjectNft.settings.projectId === project._id)
        .map(chainProjectNft => ({
          assetId: chainProjectNft._id,
          symbol: chainProjectNft.symbol,
          precision: chainProjectNft.precision,
          currentSupply: chainProjectNft.currentSupply,


          // @deprecated
          id: chainProjectNft._id,
          amount: chainProjectNft.currentSupply
        }));

      return {
        _id: project._id,
        portalId: project.portalId,
        isPrivate: isPrivate || false,
        members: members,
        attributes: attributes,
        isDefault: project.isDefault,
        teamId: project.teamId,
        isFinished: chainProject ? chainProject.isFinished : "",
        domains: chainProject ? chainProject.domains : [],
        eciMap: chainProject ? chainProject.eciMap : {},
        positiveReviewCount: chainProject ? chainProject.positiveReviewCount : 0,
        negativeReviewCount: chainProject ? chainProject.negativeReviewCount : 0,
        projectContentCount: chainProject ? chainProject.projectContentCount : 0,
        createdAt: project.createdAt || project.created_at,
        updatedAt: project.updatedAt || project.updated_at,
        nfts: nfts,
        expressLicenses: expressLicenses,
        grantedAccess: grantedAccess,
        metadataHash: chainProject ? chainProject.metadata : null,


        // @deprecated
        // external_id: project._id,
        entityId: project._id,
        description: chainProject ? chainProject.metadata : "",
        eci_per_domain: chainProject ? chainProject.eciMap : {},
        number_of_positive_reviews: chainProject ? chainProject.positiveReviewCount : 0,
        number_of_negative_reviews: chainProject ? chainProject.negativeReviewCount : 0,
        number_of_project_contents: chainProject ? chainProject.projectContentCount : 0,
        // team: {
        //   external_id: project.teamId,
        // },
        title: attributes.some(rAttr => rAttr.attributeId.toString() == PROJECT_ATTRIBUTE.TITLE.toString())
          ? attributes.find(rAttr => rAttr.attributeId.toString() == PROJECT_ATTRIBUTE.TITLE.toString()).value.toString()
          : "Not Specified",
        abstract: attributes.some(rAttr => rAttr.attributeId.toString() == PROJECT_ATTRIBUTE.DESCRIPTION.toString())
          ? attributes.find(rAttr => rAttr.attributeId.toString() == PROJECT_ATTRIBUTE.DESCRIPTION.toString()).value.toString()
          : "Not Specified",
        projectRef: {
          ...project,
          expressLicenses,
          grantedAccess
        },
        created_at: project.createdAt || project.created_at,
        last_update_time: project.updatedAt,
        security_tokens: nfts,
        securityTokens: nfts
      };
    })
      .filter(p => filter.isDefault === undefined || filter.isDefault === p.isDefault)
      .filter(p => !filter.searchTerm || p.attributes.some(rAttr => {
        const attribute = projectsAttributes.find(attr => attr._id.toString() === rAttr.attributeId.toString());
        if (!attribute || !rAttr.value) 
          return false;

        if (rAttr.attributeId.toString() == PROJECT_ATTRIBUTE.TITLE.toString() || rAttr.attributeId.toString() == PROJECT_ATTRIBUTE.DESCRIPTION.toString()) 
          return `${rAttr.value}`.toLowerCase().includes(filter.searchTerm.toLowerCase());

        if (attribute.type == ATTR_TYPES.USER || attribute.type == 'userSelect') 
          return p.members.some(m => m.toLowerCase().includes(filter.searchTerm.toLowerCase()));

        return false;
      }))
      .filter(p => !filter.portalIds.length || filter.portalIds.some(portalId => {
        return p.portalId == portalId;
      }))
      .filter(p => !filter.projectAttributes.length || filter.projectAttributes.every(fAttr => {
        const attribute = projectsAttributes.find(attr => attr._id.toString() === fAttr.attributeId.toString());
        if (!attribute)
          return false;

        const rAttr = p.attributes.find(rAttr => rAttr.attributeId.toString() === fAttr.attributeId.toString());
        return fAttr.values.some((v) => {
          if (!rAttr || !rAttr.value) 
            return !v || v === 'false';
          
          if (attribute.type == ATTR_TYPES.EXPRESS_LICENSING || attribute.type == 'expressLicensing') {
            if (v == true || v === 'true') {
              return rAttr.value.length != 0;
            } else {
              return true;
            }
          }

          if (Array.isArray(rAttr.value)) 
            return rAttr.value.some(rAttrV => rAttrV.toString() === v.toString());

          if (typeof rAttr.value === 'string') 
            return rAttr.value.includes(v.toString());

          return rAttr.value.toString() === v.toString();
        });
      }))
      .sort((a, b) => b.createdAat - a.createdAt);
  }


  async getProject(projectId) {
    const project = await this.findOne({ _id: projectId, status: PROJECT_STATUS.APPROVED });
    if (!project) return null;
    const results = await this.mapProjects([project]);
    const [result] = results;
    return result;
  }


  async getProjects(projectsIds, statuses = [PROJECT_STATUS.APPROVED]) {
    const projects = await this.findMany({ _id: { $in: [...projectsIds] }, status: { $in: [...statuses] } });
    if (!projects.length) return [];
    const result = await this.mapProjects(projects);
    return result;
  }


  async lookupProjects(filter) {
    const projects = await this.findMany({ status: PROJECT_STATUS.APPROVED });
    if (!projects.length) return [];
    const result = await this.mapProjects(projects, { ...filter, isDefault: false });
    return result;
  }


  async getProjectsByTeam(daoId) {
    const projects = await this.findMany({ teamId: daoId, status: PROJECT_STATUS.APPROVED });
    if (!projects.length) return [];
    const result = await this.mapProjects(projects, { isDefault: false });
    return result;
  }


  async getProjectsByPortal(portalId) {
    const available = await this.findMany({ status: PROJECT_STATUS.APPROVED });
    const projects = available.filter(p => p.portalId == portalId);
    if (!projects.length) return [];
    const result = await this.mapProjects(projects, { isDefault: false });
    return result;
  }


  async getProjectsForMember(member) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const teams = await teamDtoService.getTeamsByUser(member);
    const teamsIds = teams.map(({ entityId }) => entityId);
    const chainTeamsProjects = await Promise.all(teamsIds.map(teamId => chainRpc.getProjectsByTeamAsync(teamId)));
    const chainProjects = chainTeamsProjects.reduce((acc, projectsList) => {
      const projects = projectsList.filter(p => !acc.some(project => project.projectId == p.projectId));
      return [...acc, ...projects];
    }, []);
    const projects = await this.findMany({ _id: { $in: [...chainProjects.map(p => p.projectId)] }, status: PROJECT_STATUS.APPROVED });
    if (!projects.length) return [];
    const result = await this.mapProjects(projects, { isDefault: false });
    return result;
  }


  async getDefaultProject(daoId) {
    const project = await this.findOne({ isDefault: true, teamId: daoId });
    if (!project) return null;
    const results = await this.mapProjects([project], { isDefault: true });
    const [result] = results;
    return result;
  }

}

export default ProjectDtoService;