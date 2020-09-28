import deipRpc from '@deip/rpc-client';
import Research from './../schemas/research';
import ResearchApplication from './../schemas/researchApplication';
import { RESEARCH_APPLICATION_STATUS, RESEARCH_ATTRIBUTE_AREA, RESEARCH_ATTRIBUTE_TYPE } from './../constants';
import mongoose from 'mongoose';

class ResearchService {

  constructor(tenant) {
    this.researchWhitelist = tenant.settings.researchWhitelist || [];
    this.researchBlacklist = tenant.settings.researchBlacklist || [];
    this.researchAttributes = tenant.settings.researchAttributes || [];
  }


  async mapResearch(chainResearches, privateGuardFn, filterObj) {

    const filter =  {
      searchTerm: "",
      disciplines: [],
      organizations: [],
      researchAttributes: [], 
      ...filterObj
    }
    
    const researches = await Research.find({ _id: { $in: chainResearches.map(r => r.external_id) } });
    return chainResearches
      .map((chainResearch) => {
        const researchRef = researches.find(r => r._id == chainResearch.external_id);
        if (researchRef) {
          const attributes = researchRef.attributes.filter(a => this.researchAttributes.some(attr => attr.isPublished && attr._id.toString() === a.researchAttributeId.toString() && a.value));
          return { ...chainResearch, researchRef: { ...researchRef.toObject(), attributes } };
        }
        return { ...chainResearch, researchRef: null };
      })
      .filter(privateGuardFn)
      .filter(r => !this.researchWhitelist.length || this.researchWhitelist.some(id => r.external_id == id))
      .filter(r => !this.researchBlacklist.length || !this.researchBlacklist.some(id => r.external_id == id))
      .filter(r => !filter.searchTerm || (r.researchRef && r.researchRef.attributes.some(rAttr => {
        
        const attribute = this.researchAttributes.find(attr => attr._id.toString() === rAttr.researchAttributeId.toString());
        
        if (!attribute || !rAttr.value)
          return false;
        
        if (attribute.type == RESEARCH_ATTRIBUTE_TYPE.TEXT || attribute.type == RESEARCH_ATTRIBUTE_TYPE.TEXTAREA) {
          return rAttr.value.toLowerCase().includes(filter.searchTerm.toLowerCase());
        }

        if (attribute.type == RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUP || attribute.type == RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUPS_LIST) {
          return r.research_group.name.toLowerCase().includes(filter.searchTerm.toLowerCase());
        }

        if (attribute.type == RESEARCH_ATTRIBUTE_TYPE.USER || attribute.type == RESEARCH_ATTRIBUTE_TYPE.USERS_LIST) {
          return r.members.some(m => m.toLowerCase().includes(filter.searchTerm.toLowerCase()));
        }
 
        return false;
      })))
      .filter(r => !filter.researchAttributes.length || (r.researchRef && filter.researchAttributes.some(fAttr => {

        const attribute = this.researchAttributes.find(attr => attr.isFilterable && attr._id.toString() === fAttr.researchAttributeId.toString());
        const rAttr = r.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() === fAttr.researchAttributeId.toString());
        
        if (!attribute || !rAttr || !rAttr.value)
          return false;

        return fAttr.values.some((v) => {
          if (Array.isArray(rAttr.value)) {
            return rAttr.value.some(rAttrV => rAttrV.toString() === v.toString());
          }
          if (typeof rAttr.value === 'string') {
            return rAttr.value.includes(v.toString());
          }
          return rAttr.value.toString() === v.toString();
        });
      })));
  }

  async lookupResearches(lowerBound, limit, filter) {
    const chainResearches = await deipRpc.api.lookupResearchesAsync(lowerBound, limit);
    const result = await this.mapResearch(chainResearches, (r) => { return !r.is_private }, filter);
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
    if (!chainResearch) return null;
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
    attributes
  }) {

    const research = new Research({
      _id: externalId,
      researchGroupExternalId,
      attributes: attributes.map(attr => {
        return {
          researchAttributeId: mongoose.Types.ObjectId(attr.researchAttributeId.toString()),
          value: attr.value 
            ? Array.isArray(attr.value) 
              ? attr.value.map(v => mongoose.Types.ObjectId.isValid(v) ? mongoose.Types.ObjectId(v) : v) 
              : mongoose.Types.ObjectId.isValid(attr.value.toString()) 
                ? mongoose.Types.ObjectId(attr.value.toString()) 
                : attr.value 
            : null
        }
      }),
      researchGroupId: researchGroupInternalId, // legacy internal id
    });

    const savedResearch = await research.save();
    return savedResearch.toObject();
  }
  
  async updateResearchRef(externalId, { attributes }) {

    const research = await this.findResearchRef(externalId);
    research.attributes = attributes.map(attr => {
      return {
        researchAttributeId: mongoose.Types.ObjectId(attr.researchAttributeId.toString()),
        value: attr.value
          ? Array.isArray(attr.value)
            ? attr.value.map(v => mongoose.Types.ObjectId.isValid(v) ? mongoose.Types.ObjectId(v) : v)
            : mongoose.Types.ObjectId.isValid(attr.value.toString())
              ? mongoose.Types.ObjectId(attr.value.toString())
              : attr.value
          : null
      }
    });

    const updatedResearch = await research.save();
    return updatedResearch.toObject();
  }

  async findResearchApplicationById(applicationId) {
    let researchApplication = await ResearchApplication.findOne({ _id: applicationId });
    return researchApplication;
  }

  async createResearchApplication({
    proposalId,
    researchExternalId,
    researcher,
    status,
    title,
    description,
    disciplines,
    problem,
    solution,
    funding,
    eta,
    location,
    attributes,
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
      status,
      title,
      description,
      disciplines,
      problem,
      solution,
      funding,
      eta,
      location,
      attributes,
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
    attributes,
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
    researchApplication.attributes = attributes;
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

  async addAttributeToResearches({ researchAttributeId, type, defaultValue }) {
    const result = await Research.update({}, { $push: { attributes: { researchAttributeId: mongoose.Types.ObjectId(researchAttributeId), type, value: defaultValue } } }, { multi: true });
    return result;
  }

  async removeAttributeFromResearches({ researchAttributeId }) {
    const result = await Research.update({}, { $pull: { attributes: { researchAttributeId: mongoose.Types.ObjectId(researchAttributeId) } } }, { multi: true });
    return result;
  }

  async updateAttributeInResearches({ researchAttributeId, type, valueOptions, defaultValue }) {
    if (type == RESEARCH_ATTRIBUTE_TYPE.STEPPER || type == RESEARCH_ATTRIBUTE_TYPE.SELECT) {

      const result = await Research.update(
        {
          $and: [
            { 'attributes.researchAttributeId': mongoose.Types.ObjectId(researchAttributeId) },
            { 'attributes.value': { $nin: [...valueOptions.map(opt => mongoose.Types.ObjectId(opt.value))] } }
          ]
        },
        { $set: { 'attributes.$.value': defaultValue } }, 
        { multi: true }
      );

      return result;
    }
    return Promise.resolve();
  }

  async findResearchesByCategory(category) {
    let researches = await Research.find({ $and: [{ tenantCategory: { $exists: true } }, { "tenantCategory._id": category._id }] });
    const chainResearches = await deipRpc.api.getResearchesAsync(researches.map(r => r._id.toString()));
    const result = await this.mapResearch(chainResearches, (r) => { return true; });
    return result;
  }
}

export default ResearchService;