import TenantProfile from './../schemas/tenant';

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
  researchComponents,
  researchCategories,
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
      researchComponents,
      researchCategories,
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
  researchComponents,
  researchCategories,
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
  tenantProfile.settings.researchComponents = researchComponents;
  tenantProfile.settings.researchCategories = researchCategories;
  tenantProfile.settings.faq = faq;
  tenantProfile.settings.researchBlacklist = researchBlacklist;
  tenantProfile.settings.researchWhitelist = researchWhitelist;

  return tenantProfile.save();
}


export default {
  findTenantProfile,
  createTenantProfile,
  updateTenantProfile
}