import TenantProfile from './../schemas/tenant';
import mongoose from 'mongoose';

async function findTenantProfile(id) {
  const tenant = await TenantProfile.findOne({ _id: id });
  return tenant;
}

async function createTenantProfile({
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

  return tenantProfile.save();
}

async function updateTenantProfile(tenantExternalId, {
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

  let tenantProfile = await findTenantProfile(tenantExternalId);

  if (!tenantProfile) {
    throw new Error(`User profile ${us} does not exist`);
  }

  tenantProfile.name = name;
  tenantProfile.shortName = shortName;
  tenantProfile.description = description;
  tenantProfile.email = email;
  tenantProfile.logo = logo;
  tenantProfile.banner = banner;
  tenantProfile.settings.faq = faq;
  tenantProfile.settings.researchBlacklist = researchBlacklist;
  tenantProfile.settings.researchWhitelist = researchWhitelist;
  tenantProfile.settings.researchLayouts = researchLayouts;

  return tenantProfile.save();
}


async function addTenantResearchAttribute(tenantExternalId, {
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

  const tenantProfile = await findTenantProfile(tenantExternalId);
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

  return tenantProfile.save();
}


async function removeTenantResearchAttribute(tenantExternalId, {
  _id: researchAttributeId
}) {

  const tenantProfile = await findTenantProfile(tenantExternalId);
  tenantProfile.settings.researchAttributes = tenantProfile.settings.researchAttributes.filter(a => a._id.toString() !== mongoose.Types.ObjectId(researchAttributeId).toString());

  return tenantProfile.save();
}


async function updateTenantResearchAttribute(tenantExternalId, {
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

  const tenantProfile = await findTenantProfile(tenantExternalId);

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

  return tenantProfile.save();
}


export default {
  findTenantProfile,

  addTenantResearchAttribute,
  removeTenantResearchAttribute,
  updateTenantResearchAttribute,

  createTenantProfile,
  updateTenantProfile
}