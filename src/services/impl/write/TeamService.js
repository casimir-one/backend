import BaseService from './../../base/BaseService';
import TeamSchema from './../../../schemas/TeamSchema';

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