import BaseService from './../../base/BaseService';
import UserInviteSchema from './../../../schemas/UserInviteSchema';
import { USER_INVITE_STATUS } from './../../../constants';

class UserInviteService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(UserInviteSchema, options);
  }

  async findUserInvite(inviteId) {
    const result = await this.findOne({ _id: inviteId });
    return result;
  }


  async findUserPendingInvites(username) {
    const result = await this.findMany({ invitee: username, status: USER_INVITE_STATUS.SENT, expiration: { $gt: new Date().getTime() } });
    return result;
  }


  async findTeamPendingInvites(teamId) {
    const result = await this.findMany({ teamId: teamId, status: USER_INVITE_STATUS.SENT, expiration: { $gt: new Date().getTime() } });
    return result;
  }

  async createUserInvite({
    _id,
    invitee,
    creator,
    teamId,
    rewardShare,
    status,
    notes,
    expiration
  }) {

    const result = await this.createOne({
      _id,
      invitee,
      creator,
      teamId,
      rewardShare,
      status,
      notes,
      expiration,
      failReason: null
    });

    return result;
  }


  async updateUserInvite(inviteId, {
    status,
    failReason,
  }) {

    const result = await this.updateOne({ _id: inviteId }, {
      status,
      failReason
    });

    return result;
  }
}

export default UserInviteService;