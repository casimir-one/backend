import PortalSchema from '../../../schemas/PortalSchema';
import config from '../../../config';
import { ChainService } from '@casimir.one/chain-service';
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
    const team = await teamDtoService.getTeam(id);
    const { members: admins } = team;
    const pubKey = chainAccount.authority.owner.auths
      .filter((auth) => !!auth.pubKey)
      .map((auth) => auth.pubKey)[0];

    return { 
      _id: id,
      id: id, // obsolete
      pubKey: pubKey || null, 
      account: chainAccount,
      admins: admins,
      ...portal
    };
  }

  async getPortalAttributeMappings(portalId) {
    const portal = await PortalSchema.findOne({ _id: portalId });
    if (!portal) return null;
    return portal.settings.attributeMappings;
  }

  async getPortalLayoutMappings(portalId) {
    const portal = await PortalSchema.findOne({ _id: portalId });
    if (!portal) return null;
    return portal.settings.layoutMappings;
  }

  async getPortalCustomFields(portalId) {
    const portal = await PortalSchema.findOne({ _id: portalId });
    if (!portal) return null;
    return portal.settings.customFields;
  }

}

export default PortalDtoService;