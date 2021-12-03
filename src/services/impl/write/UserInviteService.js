import BaseService from './../../base/BaseService';
import UserInviteSchema from './../../../schemas/UserInviteSchema';
import { USER_INVITE_STATUS } from './../../../constants';

class UserInviteService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(UserInviteSchema, options);
  }

  async findUserInvite(externalId) {
    const result = await this.findOne({ _id: externalId });
    return result;
  }


  async findUserPendingInvites(username) {
    const result = await this.findMany({ invitee: username, status: USER_INVITE_STATUS.SENT, expiration: { $gt: new Date().getTime() } });
    return result;
  }


  async findTeamPendingInvites(teamId) {
    const result = await this.findMany({ researchGroupExternalId: teamId, status: USER_INVITE_STATUS.SENT, expiration: { $gt: new Date().getTime() } });
    return result;
  }

  async createUserInvite({
    externalId,
    invitee,
    creator,
    researchGroupExternalId,
    rewardShare,
    status,
    notes,
    expiration
  }) {

    const result = await this.createOne({
      _id: externalId,
      invitee,
      creator,
      researchGroupExternalId,
      rewardShare,
      status,
      notes,
      expiration,
      failReason: null
    });

    return result;
  }


  async updateUserInvite(externalId, {
    status,
    failReason,
  }) {

    const result = await this.updateOne({ _id: externalId }, {
      status,
      failReason
    });

    return result;
  }
}

export default UserInviteService;