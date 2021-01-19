import TenantProfile from './../schemas/tenant';
import mongoose from 'mongoose';

class TenantService {

  constructor() { };

  async findTenantProfile(id) {
    const tenant = await TenantProfile.findOne({ _id: id });
    return tenant ? tenant.toObject() : null;
  }

  async createTenantProfile({
    tenantExternalId,
    name,
    shortName,
    description,
    email,
    logo,
    banner,
    admins
  }, {
    signUpPolicy,
    faq,
    researchBlacklist,
    researchWhitelist,
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
      admins: admins,
      settings: {
        signUpPolicy,
        faq,
        researchBlacklist,
        researchWhitelist,
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
    researchBlacklist,
    researchWhitelist,
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
    tenantProfile.settings.researchBlacklist = researchBlacklist !== undefined ? researchBlacklist : tenantProfile.settings.researchBlacklist;
    tenantProfile.settings.researchWhitelist = researchWhitelist !== undefined ? researchWhitelist : tenantProfile.settings.researchWhitelist;
    tenantProfile.settings.researchLayouts = researchLayouts !== undefined ? researchLayouts : tenantProfile.settings.researchLayouts;
    
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