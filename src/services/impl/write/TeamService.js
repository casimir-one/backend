import BaseService from './../../base/BaseService';
import TeamSchema from './../../../schemas/TeamSchema';
import AttributeDtoService from './../read/AttributeDtoService';
import { AttributeScope } from '@casimir.one/platform-core'

class TeamService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(TeamSchema, options);
  }

  async createTeam({
    _id,
    creator,
    attributes,
    members,
    address
  }) {

    const attributeDtoService = new AttributeDtoService();
    const systemAttributes = await attributeDtoService.getSystemAttributes();
    const teamAttr = systemAttributes.find(attr => (attr.scope == AttributeScope.TEAM) && (attr.type == 'text'));

    // Team attribute is required
    if (teamAttr && !attributes.some(rAttr => rAttr.attributeId === teamAttr._id.toString())) {
      attributes.push({
        attributeId: teamAttr._id.toString(),
        value: `Team ${_id}`
      })
    }

    const result = await this.createOne({
      _id,
      creator,
      attributes,
      members,
      address
    });

    return result;
  }

  async updateTeam(teamId, {
    attributes,
    members
  }) {

    const result = this.updateOne({ _id: teamId }, {
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