import deipRpc from '@deip/rpc-client';
import TenantProfile from './../schemas/tenant';
import UserService from './../services/users';
import mongoose from 'mongoose';

class TenantService {

  constructor() { };

  async getTenant(id) {
    const userService = new UserService();
    const doc = await TenantProfile.findOne({ _id: id });
    if (!doc) return null;
    const profile = doc.toObject();
    const account = await deipRpc.api.getResearchGroupAsync(id);
    const tenantUsers = await userService.getUsersByTenant(id);
    const admins = tenantUsers.filter(user => userService.hasRole(user, 'admin')).map(user => user.username);
    return { id: id, account: account.account, profile: profile, admins };
  }

  async getNetworkTenant(id) {
    const doc = await TenantProfile.findOne({ _id: id });
    if (!doc) return null;
    const profile = doc.toObject();
    const account = await deipRpc.api.getResearchGroupAsync(id);
    return { id: profile._id, account: account.account, profile: { ...profile, settings: { researchAttributes: profile.settings.researchAttributes } }, network: undefined };
  }

  async getNetworkTenants() {
    const docs = await TenantProfile.find({});
    const profiles = docs.map(doc => doc.toObject());
    const accounts = await deipRpc.api.getResearchGroupsAsync(profiles.map(p => p._id));

    const result = profiles.map((profile) => {
      const account = accounts.find(a => a.account.name == profile._id);
      return { id: profile._id, account: account.account, profile: { ...profile, settings: { researchAttributes: profile.settings.researchAttributes } }, network: undefined };
    });
    return result;
  }

  async createTenantProfile({
    tenantExternalId,
    name,
    shortName,
    description,
    email,
    logo,
    banner
  }, {
    signUpPolicy,
    faq,
    researchAttributes,
    researchLayouts
  }) {

    const tenantProfile = new TenantProfile({
      _id: tenantExternalId,
      name: name,
      shortName: shortName,
      description: description,
      email: email,
      logo: logo,
      banner: banner,
      settings: {
        signUpPolicy,
        faq,
        researchAttributes: researchAttributes || [],
        researchLayouts: researchLayouts || {}
      }
    });

    const savedTenantProfile = await tenantProfile.save();
    return savedTenantProfile.toObject();
  }

  async updateTenantProfile(tenantExternalId, {
    name,
    shortName,
    description,
    email,
    logo,
    banner
  }, {
    faq,
    researchLayouts
  }) {

    const tenantProfile = await TenantProfile.findOne({ _id: tenantExternalId });
    if (!tenantProfile) {
      throw new Error(`Tenant ${tenantExternalId} does not exist`);
    }

    tenantProfile.name = name !== undefined ? name : tenantProfile.name;
    tenantProfile.shortName = shortName !== undefined ? shortName : tenantProfile.shortName;
    tenantProfile.description = description !== undefined ? description : tenantProfile.description;
    tenantProfile.email = email !== undefined ? email : tenantProfile.email;
    tenantProfile.logo = logo !== undefined ? logo : tenantProfile.logo;
    tenantProfile.banner = banner !== undefined ? banner : tenantProfile.banner;
    tenantProfile.settings.faq = faq !== undefined ? faq : tenantProfile.settings.faq;
    tenantProfile.settings.researchLayouts = researchLayouts !== undefined ? researchLayouts : tenantProfile.settings.researchLayouts;
    
    const savedTenantProfile = await tenantProfile.save();
    return savedTenantProfile.toObject();
  }


  async updateTenantNetworkSettings(tenantExternalId, {
    globalNetworkIsVisible
  }) {
    const tenantProfile = await TenantProfile.findOne({ _id: tenantExternalId });
    tenantProfile.network.scope = globalNetworkIsVisible ? ['all'] : [];
    const savedTenantProfile = await tenantProfile.save();
    return savedTenantProfile.toObject();
  }

  
  async addTenantResearchAttribute(tenantExternalId, {
    _id: researchAttributeId,
    type,
    isPublished,
    isFilterable,
    isHidden,
    isMultiple,
    title,
    shortTitle,
    description,
    valueOptions,
    defaultValue
  }) {

    const tenantProfile = await TenantProfile.findOne({ _id: tenantExternalId });
    tenantProfile.settings.researchAttributes.push({
      _id: mongoose.Types.ObjectId(researchAttributeId),
      type,
      isPublished,
      isFilterable,
      isHidden,
      isMultiple,
      title,
      shortTitle,
      description,
      valueOptions: valueOptions.map(opt => {
        return { ...opt, value: mongoose.Types.ObjectId() };
      }),
      defaultValue
    });
    
    const savedTenantProfile = await tenantProfile.save();
    return savedTenantProfile.toObject();
  }


  async removeTenantResearchAttribute(tenantExternalId, {
    _id: researchAttributeId
  }) {

    const tenantProfile = await TenantProfile.findOne({ _id: tenantExternalId });
    tenantProfile.settings.researchAttributes = tenantProfile.settings.researchAttributes.filter(a => a._id.toString() !== mongoose.Types.ObjectId(researchAttributeId).toString());
    const savedTenantProfile = await tenantProfile.save();
    return savedTenantProfile.toObject();
  }


  async updateTenantResearchAttribute(tenantExternalId, {
    _id: researchAttributeId,
    type,
    isPublished,
    isFilterable,
    isHidden,
    isMultiple,
    title,
    shortTitle,
    description,
    valueOptions,
    defaultValue
  }) {

    const tenantProfile = await TenantProfile.findOne({ _id: tenantExternalId });

    const researchAttribute = tenantProfile.settings.researchAttributes.find(a => a._id.toString() === mongoose.Types.ObjectId(researchAttributeId).toString());
    researchAttribute.type = type;
    researchAttribute.isPublished = isPublished;
    researchAttribute.isFilterable = isFilterable;
    researchAttribute.isHidden = isHidden;
    researchAttribute.isMultiple = isMultiple;
    researchAttribute.title = title;
    researchAttribute.shortTitle = shortTitle;
    researchAttribute.description = description;
    researchAttribute.valueOptions = valueOptions.map(opt => {
      return { ...opt, value: opt.value ? mongoose.Types.ObjectId(opt.value.toString()) : mongoose.Types.ObjectId() };
    });
    researchAttribute.defaultValue = defaultValue;

    const savedTenantProfile = await tenantProfile.save();
    return savedTenantProfile.toObject();
  }

}


export default TenantService;