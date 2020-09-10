import TenantProfile from './../schemas/tenant';
import mongoose from 'mongoose';

async function findTenantProfile(id) {
  const tenant = await TenantProfile.findOne({ _id: id });
  return tenant;
}

async function createTenantProfile({
  tenantId,
  name,
  shortName,
  description,
  email,
  logo,
  banner,
  admins
}, {
  signUpPolicy,
  researchAttributes,
  faq,
  researchBlacklist,
  researchWhitelist
}) {

  const tenantProfile = new TenantProfile({
    _id: tenantId,
    name: name,
    shortName: shortName,
    description: description,
    email: email,
    logo: logo,
    banner: banner,
    admins: admins,
    settings: {
      signUpPolicy,
      researchAttributes,
      faq,
      researchBlacklist,
      researchWhitelist
    }
  });

  return tenantProfile.save();
}

async function updateTenantProfile(tenantId, {
  name,
  shortName,
  description,
  email,
  logo,
  banner
}, {
  faq,
  researchBlacklist,
  researchWhitelist
}) {

  let tenantProfile = await findTenantProfile(tenantId);

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

  return tenantProfile.save();
}


async function addTenantResearchAttribute(tenantId, {
  _id: researchAttributeId,
  type,
  isVisible,
  title,
  shortTitle,
  description,
  valueOptions,
  defaultValue
}) {

  const tenantProfile = await findTenantProfile(tenantId);
  tenantProfile.settings.researchAttributes.push({
    _id: mongoose.Types.ObjectId(researchAttributeId),
    type,
    isVisible,
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


async function removeTenantResearchAttribute(tenantId, {
  _id: researchAttributeId
}) {

  const tenantProfile = await findTenantProfile(tenantId);
  tenantProfile.settings.researchAttributes = tenantProfile.settings.researchAttributes.filter(a => a._id.toString() !== mongoose.Types.ObjectId(researchAttributeId).toString());

  return tenantProfile.save();
}


async function updateTenantResearchAttribute(tenantId, {
  _id: researchAttributeId,
  type,
  isVisible,
  title,
  shortTitle,
  description,
  valueOptions,
  defaultValue
}) {

  const tenantProfile = await findTenantProfile(tenantId);

  const researchAttribute = tenantProfile.settings.researchAttributes.find(a => a._id.toString() === mongoose.Types.ObjectId(researchAttributeId).toString());
  
  researchAttribute.type = type;
  researchAttribute.isVisible = isVisible;
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