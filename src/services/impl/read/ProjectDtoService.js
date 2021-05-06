import deipRpc from '@deip/rpc-client';
import mongoose from 'mongoose';
import BaseService from './../../base/BaseService';
import ProjectSchema from './../../../schemas/ProjectSchema'; // TODO: separate read/write schemas
import ExpressLicensingService from './../../legacy/expressLicensing';
import ResearchNdaService from './../../legacy/researchNda';
import UserService from './../../legacy/users';
import AttributesService from './../../legacy/attributes';
import { ATTRIBUTE_TYPE, RESEARCH_ATTRIBUTE, RESEARCH_STATUS, ATTRIBUTE_SCOPE } from './../../../constants';


class ProjectDtoService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ProjectSchema, options);
  }

  async mapResearch(researches, filterObj) {
    const expressLicensingService = new ExpressLicensingService();
    const researchNdaService = new ResearchNdaService();
    const userService = new UserService();
    const attributesService = new AttributesService()

    const filter = {
      searchTerm: "",
      researchAttributes: [],
      tenantIds: [],
      ...filterObj
    }

    const chainResearches = await deipRpc.api.getResearchesAsync(researches.map(r => r._id));
    const researchesExpressLicenses = await expressLicensingService.getExpressLicensesByResearches(chainResearches.map(r => r.external_id));
    const chainResearchNdaList = await Promise.all(chainResearches.map(r => researchNdaService.getResearchNdaListByResearch(r.external_id)));
    const researchAttributes = await attributesService.getAttributesByScope(ATTRIBUTE_SCOPE.PROJECT);
    
    return chainResearches
      .map((chainResearch) => {
        const researchRef = researches.find(r => r._id.toString() == chainResearch.external_id);
        const expressLicenses = researchesExpressLicenses.filter(l => l.researchExternalId == chainResearch.external_id);
        // TEMP
        const grantedAccess = chainResearchNdaList
          .reduce((acc, list) => { return [...acc, ...list] }, [])
          .filter((nda) => nda.research_external_id == chainResearch.external_id)
          .reduce((acc, nda) => {
            return [...acc, ...nda.parties];
          }, []);

        const attributes = researchRef ? researchRef.attributes : [];
       
        const title = attributes.some(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString())
          ? attributes.find(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString()).value.toString()
          : "Not Specified";

        const abstract = attributes.some(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.DESCRIPTION.toString())
          ? attributes.find(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.DESCRIPTION.toString()).value.toString()
          : "Not Specified";

        const isPrivate = attributes.some(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.IS_PRIVATE.toString())
          ? attributes.find(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.IS_PRIVATE.toString()).value.toString() === 'true'
          : false;

        return { ...chainResearch, tenantId: researchRef ? researchRef.tenantId : null, title, abstract, isPrivate, researchRef: researchRef ? { ...researchRef, expressLicenses, grantedAccess } : { attributes: [], expressLicenses: [], grantedAccess: [] } };
      })
      .filter(r => !filter.searchTerm || (r.researchRef && r.researchRef.attributes.some(rAttr => {
        
        const attribute = researchAttributes.find(attr => attr._id.toString() === rAttr.attributeId.toString());
        if (!attribute || !rAttr.value)
          return false;
        
        if (rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString() || rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.DESCRIPTION.toString()) {
          return `${rAttr.value}`.toLowerCase().includes(filter.searchTerm.toLowerCase());
        }

        // if (attribute.type == ATTRIBUTE_TYPE.RESEARCH_GROUP) {
        //   return r.research_group.name.toLowerCase().includes(filter.searchTerm.toLowerCase());
        // }

        if (attribute.type == ATTRIBUTE_TYPE.USER) {
          return r.members.some(m => m.toLowerCase().includes(filter.searchTerm.toLowerCase()));
        }
 
        return false;
      })))
      .filter(r => !filter.tenantIds.length || (r.researchRef && filter.tenantIds.some(tenantId => {
        return r.researchRef.tenantId == tenantId;
      })))
      .filter(r => !filter.researchAttributes.length || (r.researchRef && filter.researchAttributes.every(fAttr => {

        const attribute = researchAttributes.find(attr => attr._id.toString() === fAttr.attributeId.toString());
        if (!attribute) {
          return false;
        }

        const rAttr = r.researchRef.attributes.find(rAttr => rAttr.attributeId.toString() === fAttr.attributeId.toString());
        return fAttr.values.some((v) => {

          if (!rAttr || !rAttr.value) {
            return !v || v === 'false';
          }

          if (attribute.type == ATTRIBUTE_TYPE.EXPRESS_LICENSING) {
            if (v == true || v === 'true') {
              return rAttr.value.length != 0;
            } else {
              return true;
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

      })))
      .sort((a, b) => b.researchRef.created_at - a.researchRef.created_at);
  }


  async lookupResearches(filter) {
    const researches = await this.findMany({ status: RESEARCH_STATUS.APPROVED });
    if (!researches.length) return [];
    const result = await this.mapResearch(researches, filter);
    return result;
  }


  async getResearch(researchExternalId) {
    const research = await this.findOne({ _id: researchExternalId, status: RESEARCH_STATUS.APPROVED });
    if (!research) return null;
    const results = await this.mapResearch([research]);
    const [result] = results;
    return result;
  }


  async getResearches(researchesExternalIds, statuses = [ RESEARCH_STATUS.APPROVED ]) {
    const researches = await this.findMany({ _id: { $in: [...researchesExternalIds] }, status: { $in: [...statuses] } });
    if (!researches.length) return [];
    const result = await this.mapResearch(researches);
    return result;
  }


  async getResearchesByResearchGroup(researchGroupExternalId) {
    const researches = await this.findMany({ researchGroupExternalId: researchGroupExternalId, status: RESEARCH_STATUS.APPROVED });
    if (!researches.length) return [];
    const result = await this.mapResearch(researches);
    return result;
  }


  async getResearchesByTenant(tenantId) {
    const available = await this.findMany({ status: RESEARCH_STATUS.APPROVED });
    const researches = available.filter(r => r.tenantId == tenantId);
    if (!researches.length) return [];
    const result = await this.mapResearch(researches);
    return result;
  }


  async getResearchesForMember(member) {
    const chainResearches = await deipRpc.api.getResearchesByResearchGroupMemberAsync(member);
    const researches = await this.findMany({ _id: { $in: [...chainResearches.map(r => r.external_id)] }, status: RESEARCH_STATUS.APPROVED });
    if (!researches.length) return [];
    const result = await this.mapResearch(researches);
    return result;
  }
  

  async addAttributeToResearches({ attributeId, type, defaultValue }) {
    const result = await this.updateMany({}, { $push: { attributes: { attributeId: mongoose.Types.ObjectId(attributeId), type, value: defaultValue } } });
    return result;
  }


  async removeAttributeFromResearches({ attributeId }) {
    const result = await this.updateMany({}, { $pull: { attributes: { attributeId: mongoose.Types.ObjectId(attributeId) } } });
    return result;
  }


  async updateAttributeInResearches({ attributeId, type, valueOptions, defaultValue }) {
    if (type == ATTRIBUTE_TYPE.STEPPER || type == ATTRIBUTE_TYPE.SELECT) {
      const result = await this.updateMany(
        {
          $and: [
            { 'attributes.attributeId': mongoose.Types.ObjectId(attributeId) },
            { 'attributes.value': { $nin: [...valueOptions.map(opt => mongoose.Types.ObjectId(opt.value))] } }
          ]
        },
        { $set: { 'attributes.$.value': defaultValue } }
      );

      return result;
    } else {
      return Promise.resolve();
    }
  }


  async getProjectView(projectId) {
    const project = await this.findOne({ _id: projectId });
    if (!project) return null;
    return project;
  }

}

export default ProjectDtoService;