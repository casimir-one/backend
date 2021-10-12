import BaseService from './../../base/BaseService';
import TeamSchema from './../../../schemas/TeamSchema';
import AttributeDtoService from './../read/AttributeDtoService';
import { ATTR_SCOPES, ATTR_TYPES } from '@deip/constants';

class TeamService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(TeamSchema, options);
  }

  async createTeam({
    externalId,
    creator,
    attributes,
    members
  }) {

    const attributeDtoService = new AttributeDtoService();
    const systemAttributes = await attributeDtoService.getSystemAttributes();
    const teamAttr = systemAttributes.find(attr => attr.scope == ATTR_SCOPES.TEAM && attr.type == ATTR_TYPES.TEXT);

    // Team attribute is required
    if (teamAttr && !attributes.some(rAttr => rAttr.attributeId === teamAttr._id.toString())) {
      attributes.push({
        attributeId: teamAttr._id.toString(),
        value: `Team ${externalId}`
      })
    }

    const result = await this.createOne({
      _id: externalId,
      creator,
      attributes,
      members
    });

    return result;
  }

  async updateTeam(externalId, {
    attributes,
    members
  }) {

    const result = this.updateOne({ _id: externalId }, {
      attributes,
      members
    });

    return result;
  }

  async getTeam(teamId) {
    const team = await this.findOne({ _id: teamId });
    if (!team) return null;
    return team;
  }
}

export default TeamService;