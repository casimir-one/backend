import BaseService from './../../base/BaseService';
import TeamSchema from './../../../schemas/TeamSchema';
import AttributeDtoService from './../read/AttributeDtoService';
import { ATTRIBUTE_TYPE, ATTR_SCOPES } from './../../../constants';

class TeamService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(TeamSchema, options);
  }

  async createTeam({
    externalId,
    creator,
    attributes
  }) {

    const attributeDtoService = new AttributeDtoService();
    const systemAttributes = await attributeDtoService.getSystemAttributes();
    const teamAttr = systemAttributes.find(attr => attr.scope == ATTR_SCOPES.TEAM && attr.type == ATTRIBUTE_TYPE.TEXT);

    // Team attribute is required
    if (!attributes.some(rAttr => rAttr.attributeId === teamAttr._id.toString())) {
      attributes.push({
        attributeId: teamAttr._id.toString(),
        value: `Team ${externalId}`
      })
    }

    const result = await this.createOne({
      _id: externalId,
      creator,
      attributes
    });

    return result;
  }


  async updateTeam(externalId, {
    attributes
  }) {

    const result = this.updateOne({ _id: externalId }, {
      attributes
    });

    return result;
  }
}

export default TeamService;