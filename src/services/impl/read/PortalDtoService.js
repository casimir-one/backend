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
    const portal = doc.toObject();
    const chainAccount = await chainRpc.getAccountAsync(id);
    const getAccountsListAsync = await chainRpc.getAccountsListAsync();
    const team = await teamDtoService.getTeam(id);
    const { members: admins } = team;
    const pubKey = chainAccount.authority.owner.auths
      .filter((auth) => !!auth.pubKey)
      .map((auth) => auth.pubKey)[0];

    return { 
      id: id, 
      pubKey: pubKey || null, 
      account: chainAccount,
      profile: portal,
      admins: admins 
    };

  }

  async getNetworkPortal(id) {
    const doc = await PortalSchema.findOne({ _id: id });
    if (!doc) return null;
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const portal = doc.toObject();
    const chainAccount = await chainRpc.getAccountAsync(id);

    return { 
      id: portal._id, 
      account: chainAccount,
      profile: { 
        ...portal,
      }, 
      network: undefined 
    };
  }

  async getNetworkPortals() {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const docs = await PortalSchema.find({});
    const portals = docs.map(doc => doc.toObject());
    const chainAccounts = await chainRpc.getAccountsAsync(portals.map(p => p._id));

    const result = portals.map((portal) => {
      const chainAccount = chainAccounts.find(a => a.name == portal._id);
      return { 
        id: portal._id,
        account: chainAccount,
        profile: { 
          ...portal
        }, 
        network: undefined 
      };
    });
    return result;
  }

  async getPortalAttributeSettings(portalId) {
    const portal = await PortalSchema.findOne({ _id: portalId });
    if (!portal) return null;
    return portal.settings.attributeSettings;
  }

  async getPortalLayouts(portalId) {
    const portal = await PortalSchema.findOne({ _id: portalId });
    if (!portal) return null;
    return portal.settings.layouts;
  }

  async getPortalLayoutSettings(portalId) {
    const portal = await PortalSchema.findOne({ _id: portalId });
    if (!portal) return null;
    return portal.settings.layoutSettings;
  }

}

export default PortalDtoService;