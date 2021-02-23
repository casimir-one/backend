import deipRpc from '@deip/rpc-client';
import BaseReadModelService from './base';
import JoinRequest from './../schemas/joinRequest';


class UserJoinRequestService extends BaseReadModelService {

  constructor(options = { scoped: true }) {
    super(JoinRequest, options); 
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