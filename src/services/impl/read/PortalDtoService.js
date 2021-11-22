import PortalSchema from '../../../schemas/PortalSchema';
import config from '../../../config';
import { ChainService } from '@deip/chain-service';
import TeamDtoService from './TeamDtoService';

const teamDtoService = new TeamDtoService();

class PortalDtoService {

  constructor() {};

  async getPortal(id) {
    const doc = await PortalSchema.findOne({ _id: id });
    if (!doc) return null;
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const profile = doc.toObject();
    const [account] = await chainRpc.getAccountsAsync([id]);
    const team = await teamDtoService.getTeam(config.TENANT);
    const { members: admins } = team;

    return { id: id, pubKey: account.owner.key_auths[0][0], account: account, profile: profile, admins };
  }

  async getNetworkPortal(id) {
    const doc = await PortalSchema.findOne({ _id: id });
    if (!doc) return null;
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const profile = doc.toObject();
    const [account] = await chainRpc.getAccountsAsync([id]);
    return { id: profile._id, account: account, profile: { ...profile, settings: { researchAttributes: profile.settings.researchAttributes } }, network: undefined };
  }

  async getNetworkPortals() {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const docs = await PortalSchema.find({});
    const profiles = docs.map(doc => doc.toObject());
    const accounts = await chainRpc.getAccountsAsync(profiles.map(p => p._id));

    const result = profiles.map((profile) => {
      const account = accounts.find(a => a.name == profile._id);
      return { id: profile._id, account: account, profile: { ...profile, settings: { researchAttributes: profile.settings.researchAttributes } }, network: undefined };
    });
    return result;
  }

  async getPortalAttributeSettings(portalId) {
    const profile = await PortalSchema.findOne({ _id: portalId });
    if (!profile) return null;
    return profile.settings.attributeSettings;
  }

  async getPortalLayouts(portalId) {
    const profile = await PortalSchema.findOne({ _id: portalId });
    if (!profile) return null;
    return profile.settings.layouts;
  }

  async getPortalLayoutSettings(portalId) {
    const profile = await PortalSchema.findOne({ _id: portalId });
    if (!profile) return null;
    return profile.settings.layoutSettings;
  }

}

export default PortalDtoService;