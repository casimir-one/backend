import deipRpc from '@deip/rpc-client';
import BaseService from './../../base/BaseService';
import TeamSchema from './../../../schemas/TeamSchema';


class TeamService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(TeamSchema, options);
  }

  async createTeam({
    externalId,
    creator,
    attributes
  }) {

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