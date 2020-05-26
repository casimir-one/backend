import deipRpc from '@deip/rpc-client';
import Research from './../schemas/research';
import ResearchApplication from './../schemas/researchApplication';
import { RESEARCH_APPLICATION_STATUS, RESEARCH_COMPONENT_TYPE } from './../constants';

class ResearchService {

  constructor(tenant) {
    this.researchWhitelist = tenant.settings.researchWhitelist;
    this.researchBlacklist = tenant.settings.researchBlacklist;
    this.activeComponents = tenant.settings.researchComponents.filter(comp => comp.isVisible);
  }

  async mapResearch(chainResearches, privateGuard = (r) => { return !r.is_private }) {
    const researches = await Research.find({ _id: { $in: chainResearches.map(r => r.external_id) } });
    return chainResearches
      .filter(r => !this.researchWhitelist || this.researchWhitelist.some(id => r.external_id == id))
      .filter(r => !this.researchBlacklist || !this.researchBlacklist.some(id => r.external_id == id))
      .filter(privateGuard)
      .map((chainResearch) => {
        const research = researches.find(r => r._id == chainResearch.external_id);
        if (research) {
          const tenantCriterias = research.tenantCriterias.filter(criteria => this.activeComponents.some(comp => comp._id.toString() == criteria.component));
          const tenantCriteriasReadingList = tenantCriterias
            .map((criteria) => {
              const { component: componentId, value } = criteria;
              const componentSchema = this.activeComponents.find(comp => comp._id.toString() == componentId);
              if (componentSchema && value && componentSchema.type == RESEARCH_COMPONENT_TYPE.STEPPER) {
                const { component, type } = componentSchema;
                const { index } = value;
                const step = component.readinessLevels[index];
                if (!step) return null;

                const readinessLevelTitle = component.readinessLevelTitle;
                const readinessLevelShortTitle = component.readinessLevelShortTitle;
                return { type, value, step, readinessLevelTitle, readinessLevelShortTitle };
              }
              return null;
            })
            .filter((criteria) => !!criteria);

          return { ...chainResearch, researchRef: { ...research.toObject(), tenantCriterias, tenantCriteriasReadingList } };
        }
        return { ...chainResearch, researchRef: null };
      });
  }


  async lookupResearches(lowerBound, limit) {
    const chainResearches = await deipRpc.api.lookupResearchesAsync(lowerBound, limit);
    const result = await this.mapResearch(chainResearches);
    return result;
  }


  async getResearchesByResearchGroupMember(member, requester) {
    const chainResearches = await deipRpc.api.getResearchesByResearchGroupMemberAsync(member);
    const result = await this.mapResearch(chainResearches, (r) => !r.is_private || r.members.some(m => m == requester));
    return result;
  }


  async getResearchesByResearchGroup(researchGroupExternalId, requester) {
    const chainResearches = await deipRpc.api.getResearchesByResearchGroupAsync(researchGroupExternalId);
    const result = await this.mapResearch(chainResearches, (r) => !r.is_private || r.members.some(m => m == requester));
    return result;
  }


  async getResearch(researchExternalId) {
    const chainResearch = await deipRpc.api.getResearchAsync(researchExternalId);
    const result = await this.mapResearch([chainResearch], (r) => { return true; });
    const [research] = result;
    return research;
  }


  async findResearchRef(externalId) {
    let research = await Research.findOne({ _id: externalId });
    return research;
  }


  async createResearchRef({
    externalId,
    researchGroupExternalId,
    researchGroupInternalId,
    milestones,
    videoSrc,
    partners,
    tenantCriterias,
    tenantCategory
  }) {

    const research = new Research({
      _id: externalId,
      researchGroupExternalId,
      milestones,
      videoSrc,
      partners,
      tenantCriterias,
      tenantCategory,
      researchGroupId: researchGroupInternalId, // legacy internal id
    });

    return research.save();
  }
  
  async updateResearchRef(externalId, {
    milestones,
    videoSrc,
    partners,
    tenantCriterias,
    tenantCategory
  }) {

    const research = await this.findResearchRef(externalId);
    research.milestones = milestones;
    research.videoSrc = videoSrc;
    research.partners = partners;
    research.tenantCriterias = tenantCriterias;
    research.tenantCategory = tenantCategory;

    return research.save();
  }

  async findResearchApplicationById(applicationId) {
    let researchApplication = await ResearchApplication.findOne({ _id: applicationId });
    return researchApplication;
  }

  async createResearchApplication({
    proposalId,
    researchExternalId,
    researcher,
    title,
    description,
    disciplines,
    problem,
    solution,
    funding,
    eta,
    location,
    tenantCriterias,
    budgetAttachment,
    businessPlanAttachment,
    cvAttachment,
    marketResearchAttachment,
    tx
  }) {

    const researchApplication = new ResearchApplication({
      _id: proposalId,
      researchExternalId,
      researcher,
      status: RESEARCH_APPLICATION_STATUS.PENDING,
      title,
      description,
      disciplines,
      problem,
      solution,
      funding,
      eta,
      location,
      tenantCriterias,
      budgetAttachment,
      businessPlanAttachment,
      cvAttachment,
      marketResearchAttachment,
      tx
    });

    return researchApplication.save();
  }


  async updateResearchApplication(applicationId, {
    status,
    description,
    disciplines,
    problem,
    solution,
    funding,
    eta,
    location,
    tenantCriterias,
    budgetAttachment,
    businessPlanAttachment,
    cvAttachment,
    marketResearchAttachment
  }) {

    const researchApplication = await this.findResearchApplicationById(applicationId);
    researchApplication.description = description;
    researchApplication.status = status;
    researchApplication.disciplines = disciplines;
    researchApplication.problem = problem;
    researchApplication.solution = solution;
    researchApplication.funding = funding;
    researchApplication.eta = eta;
    researchApplication.location = location;
    researchApplication.tenantCriterias = tenantCriterias;
    researchApplication.budgetAttachment = budgetAttachment;
    researchApplication.businessPlanAttachment = businessPlanAttachment;
    researchApplication.cvAttachment = cvAttachment;
    researchApplication.marketResearchAttachment = marketResearchAttachment;

    return researchApplication.save();
  }


  async getResearchApplications({ status, researcher }) {
    const query = {};
    if (status) {
      query.status = status;
    }
    if (researcher) {
      query.researcher = researcher;
    }
    const result = await ResearchApplication.find(query);
    return result;
  }

  async handleResearchCriterias(oldComponents, newComponents) {

    const addedComponents = [];
    const removedComponents = [];

    for (let i = 0; i < newComponents.length; i++) {
      let newCom = newComponents[i];
      if (oldComponents.some(oldCom => oldCom._id.toString() == newCom._id.toString())) continue;
      addedComponents.push(newCom);
    }

    for (let i = 0; i < oldComponents.length; i++) {
      let oldCom = oldComponents[i];
      if (newComponents.some(newCom => newCom._id.toString() == oldCom._id.toString())) continue;
      removedComponents.push(oldCom);
    }

    let addedCriteriaPromises = [];
    for (let i = 0; i < addedComponents.length; i++) {
      let component = addedComponents[i];
      addedCriteriaPromises.push(this.addCriteriaToResearches({
        component: component._id.toString(),
        type: component.type
      }))
    }

    let removedCriteriaPromises = [];
    for (let i = 0; i < removedComponents.length; i++) {
      let component = removedComponents[i];
      removedCriteriaPromises.push(this.removeCriteriaToResearches({
        component: component._id.toString()
      }))
    }

    await Promise.all(addedCriteriaPromises);
    await Promise.all(removedCriteriaPromises);
  }


  async addCriteriaToResearches({ component, type }) {
    const result = await Research.update({}, { $push: { tenantCriterias: { component: component, type: type } } }, { multi: true });
    return result;
  }

  async removeCriteriaToResearches({ component }) {
    const result = await Research.update({}, { $pull: { tenantCriterias: { component: component } } }, { multi: true });
    return result;
  }

}

export default ResearchService;