import BaseService from './../base/BaseService';
import JoinRequestSchema from './../../schemas/JoinRequestSchema';


class UserJoinRequestService extends BaseService {

  constructor(options = { scoped: true }) {
    super(JoinRequestSchema, options);
  }


  async getJoinRequestsByResearchGroup(researchGroupExternalId) {
    const result = await this.findMany({ researchGroupExternalId });
    return result;
  }

  
  async getJoinRequestsByUser(username) {
    const result = await this.findMany({ username });
    return result;
  }


  async getActiveJoinRequestForUser(researchGroupExternalId, username) {
    const result = await this.findOne({ researchGroupExternalId, username, 'status': { $in: ['approved', 'pending'] } });
    return result;
  }


  async createJoinRequest({
    username,
    researchGroupExternalId,
    coverLetter,
    status
  }) {

    const result = await this.createOne({
      username,
      researchGroupExternalId,
      coverLetter,
      status
    });
    
    return result;
  }


  async updateJoinRequest(id, {
    status
  }) {

    const result = await this.updateOne({ _id: id }, {
      status
    });

    return result;
  }
}

export default UserJoinRequestService;