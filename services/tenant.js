import TenantProfile from './../schemas/tenant';

async function findTenantProfile(id) {
  const tenant = await TenantProfile.findOne({ _id: id });
  return tenant;
}


export default {
  findTenantProfile
}