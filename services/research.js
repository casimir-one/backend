import deipRpc from '@deip/rpc-client';
import Research from './../schemas/research';
import ExpressLicense from './../schemas/expressLicense';
import ResearchApplication from './../schemas/researchApplication';
import mongoose from 'mongoose';
import { RESEARCH_ATTRIBUTE_TYPE, RESEARCH_ATTRIBUTE } from './../constants';

class ResearchService {

  constructor(tenant) {
    this.researchAttributes = tenant.settings.researchAttributes || [];
  }

  async mapResearch(chainResearches, filterObj) {

    const filter =  {
      searchTerm: "",
      disciplines: [],
      organizations: [],
      researchAttributes: [], 
      ...filterObj
    }
    
    const researchExternalIds = chainResearches.map(r => r.external_id);

    const researches = await Research.find({ _id: { $in: researchExternalIds } });
    // TODO: replace with service call
    const researchesExpressLicenses = await ExpressLicense.find({ researchExternalId: { $in: researchExternalIds } });
    
    return chainResearches
      .map((chainResearch) => {
        const researchRef = researches.find(r => r._id == chainResearch.external_id);
        const expressLicenses = researchesExpressLicenses.filter(l => l.researchExternalId == chainResearch.external_id).map(l => l.toObject());
        const attributes = researchRef ? researchRef.attributes : [];
       
        const title = attributes.some(rAttr => rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString())
          ? attributes.find(rAttr => rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString()).value
          : "Not Specified";

        const abstract = attributes.some(rAttr => rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString())
          ? attributes.find(rAttr => rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.DESCRIPTION.toString()).value
          : "Not Specified";

        return { ...chainResearch, title, abstract, researchRef: researchRef ? { ...researchRef.toObject(), expressLicenses } : { attributes: [], expressLicenses: []} };
      })
      .filter(r => !filter.searchTerm || (r.researchRef && r.researchRef.attributes.some(rAttr => {
        
        const attribute = this.researchAttributes.find(attr => attr._id.toString() === rAttr.researchAttributeId.toString());
        
        if (!attribute || !rAttr.value)
          return false;
        
        if (attribute.type == RESEARCH_ATTRIBUTE_TYPE.TEXT || attribute.type == RESEARCH_ATTRIBUTE_TYPE.TEXTAREA) {
          return rAttr.value.toLowerCase().includes(filter.searchTerm.toLowerCase());
        }

        if (attribute.type == RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUP) {
          return r.research_group.name.toLowerCase().includes(filter.searchTerm.toLowerCase());
        }

        if (attribute.type == RESEARCH_ATTRIBUTE_TYPE.USER) {
          return r.members.some(m => m.toLowerCase().includes(filter.searchTerm.toLowerCase()));
        }
 
        return false;
      })))
      .filter(r => !filter.researchAttributes.length || (r.researchRef && filter.researchAttributes.every(fAttr => {

        const attribute = this.researchAttributes.find(attr => attr._id.toString() === fAttr.researchAttributeId.toString());
        const rAttr = r.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() === fAttr.researchAttributeId.toString());
        
        if (!attribute || !rAttr) {
          return false;
        }

        return fAttr.values.some((v) => {

          if (!rAttr.value) {
              return v == null;
          }

          if (attribute.type == RESEARCH_ATTRIBUTE_TYPE.EXPRESS_LICENSING) {
            if (v == true || v === 'true') {
              return rAttr.value.length != 0;
            } else {
              return false;
            }
          }

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
    const result = await this.mapResearch(chainResearches, filter);
    return result;
  }


  async getResearch(researchExternalId) {
    const chainResearch = await deipRpc.api.getResearchAsync(researchExternalId);
    if (!chainResearch) return null;
    const result = await this.mapResearch([chainResearch]);
    const [research] = result;
    return research;
  }


  async getResearches(researchesExternalIds) {
    const chainResearches = await deipRpc.api.getResearchesAsync(researchesExternalIds);
    const result = await this.mapResearch(chainResearches);
    return result;
  }


  async getResearchesByResearchGroup(researchGroupExternalId) {
    const chainResearches = await deipRpc.api.getResearchesByResearchGroupAsync(researchGroupExternalId);
    const result = await this.mapResearch(chainResearches);
    return result;
  }


  async getResearchesForMember(member) {
    const chainResearches = await deipRpc.api.getResearchesByResearchGroupMemberAsync(member);
    const result = await this.mapResearch(chainResearches);
    return result;
  }


  async getResearchesForMemberByResearchGroup(researchGroupExternalId) {
    const chainResearches = await deipRpc.api.getResearchesByResearchGroupAsync(researchGroupExternalId);
    const result = await this.mapResearch(chainResearches);
    return result;
  }


  async findResearchRef(externalId) {
    let research = await Research.findOne({ _id: externalId });
    return research ? research.toObject() : null;
  }


  async createResearchRef({
    externalId,
    researchGroupExternalId,
    attributes,
    status
  }) {

    const research = new Research({
      _id: externalId,
      researchGroupExternalId,
      status,
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
      })
    });

    const savedResearch = await research.save();
    return savedResearch.toObject();
  }
  
  async updateResearchRef(externalId, { status, attributes }) {

    const research = await Research.findOne({ _id: externalId });
    research.status = status ? status : research.status;
    research.attributes = attributes ? attributes.map(attr => {
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
    }) : research.attributes;

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