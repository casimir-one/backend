import deipRpc from '@deip/rpc-client';
import TenantSchema from './../../schemas/TenantSchema';
import { UserDtoService, UserService } from './../../services';
import config from './../../config';


class TenantService {

  constructor() { };

  async getTenant(id) {
    const userService = new UserService();
    const userDtoService = new UserDtoService();
    const doc = await TenantSchema.findOne({ _id: id });
    if (!doc) return null;
    const profile = doc.toObject();
    const account = await deipRpc.api.getResearchGroupAsync(id);
    const tenantUsers = await userDtoService.getUsersByTenant(id);
    const usersWithAdminRole = tenantUsers.filter(user => userService.hasRole(user, 'admin'));

    const chainMembershipTokens = await Promise.all(usersWithAdminRole.map(u => deipRpc.api.getResearchGroupTokensByAccountAsync(u.username)));

    const admins = usersWithAdminRole.filter(user => {
      const membershipTokens = chainMembershipTokens.find((teams) => teams.length && teams[0].owner == user.username) || [];
      const teams = membershipTokens.map((mt) => mt.research_group.external_id);
      return teams.includes(config.TENANT);
    }).map(user => user.username);
    return { id: id, account: account.account, profile: profile, admins };
  }

  async getNetworkTenant(id) {
    const doc = await TenantSchema.findOne({ _id: id });
    if (!doc) return null;
    const profile = doc.toObject();
    const account = await deipRpc.api.getResearchGroupAsync(id);
    return { id: profile._id, account: account.account, profile: { ...profile, settings: { researchAttributes: profile.settings.researchAttributes } }, network: undefined };
  }

  async getNetworkTenants() {
    const docs = await TenantSchema.find({});
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
    layouts
  }) {

    const tenantProfile = new TenantSchema({
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
        layouts: layouts || {}
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
    layouts
  }) {

    const tenantProfile = await TenantSchema.findOne({ _id: tenantExternalId });
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
    tenantProfile.settings.layouts = layouts !== undefined ? layouts : tenantProfile.settings.layouts;
    
    const savedTenantProfile = await tenantProfile.save();
    return savedTenantProfile.toObject();
  }


  async updateTenantNetworkSettings(tenantExternalId, {
    globalNetworkIsVisible
  }) {
    const tenantProfile = await TenantSchema.findOne({ _id: tenantExternalId });
    tenantProfile.network.scope = globalNetworkIsVisible ? ['all'] : [];
    const savedTenantProfile = await tenantProfile.save();
    return savedTenantProfile.toObject();
  }

  async updateTenantAttributeSettings(tenantId, attributeSettings) {
    const tenantProfile = await TenantSchema.findOne({ _id: tenantId });
    tenantProfile.settings.attributeSettings = attributeSettings;
    const savedTenantProfile = await tenantProfile.save();
    return savedTenantProfile.toObject();
  }

  async getTenantAttributeSettings(tenantId) {
    const profile = await TenantSchema.findOne({ _id: tenantId });
    if (!profile) return null;
    return profile.settings.attributeSettings;
  }

  async updateTenantLayouts(tenantId, layouts) {
    const tenantProfile = await TenantSchema.findOne({ _id: tenantId });
    tenantProfile.settings.layouts = layouts;
    const savedTenantProfile = await tenantProfile.save();
    return savedTenantProfile.toObject();
  }

  async getTenantLayouts(tenantId) {
    const profile = await TenantSchema.findOne({ _id: tenantId });
    if (!profile) return null;
    return profile.settings.layouts;
  }
}


export default TenantService;