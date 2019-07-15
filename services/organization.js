import deipRpc from '@deip/deip-rpc-client';
import OrganizationProfile from './../schemas/organization';

export async function findOrganizationById(_id) {
  const fr = await OrganizationProfile.findOne({ _id });
  return fr;
}

export async function findOrganizationByPermlink(permlink) {
  const fr = await OrganizationProfile.findOne({ permlink });
  return fr;
}

export async function createOrganizationProfile(
  permlink,
  name,
  website,
  fullName,
  description,
  country,
  city,
  addressLine1,
  addressLine2,
  zip,
  phoneNumber,
  email,
  members,
  logo = 'default_organization_logo.png'
) {

  const org = new OrganizationProfile({
    permlink: permlink,
    name: name,
    website: website,
    fullName: fullName,
    description: description,
    country: country,
    city: city,
    addressLine1: addressLine1,
    addressLine2: addressLine2,
    zip: zip,
    phoneNumber: phoneNumber,
    email: email,
    members: members,
    logo: logo
  });
  const saveOrg = await org.save();
  return saveOrg;
}

