import deipRpc from '@deip/rpc-client';
import UserInvite from './../schemas/userInvite';
import { USER_INVITE_STATUS, USER_NOTIFICATION_TYPE } from './../constants';


class UserInviteService {

  constructor() {}


  async findUserInvite(externalId) { // proposal id
    let invite = await UserInvite.findOne({ _id: externalId });
    return invite.toObject();
  }


  async findUserPendingInvites(username) {
    let activeInvites = await UserInvite.find({ invitee: username, status: USER_INVITE_STATUS.SENT });
    return activeInvites.filter(invite => invite.expiration.getTime() > new Date().getTime());
  }


  async findResearchGroupPendingInvites(researchGroupExternalId) {
    let rgInvites = await UserInvite.find({ researchGroupExternalId: researchGroupExternalId, status: USER_INVITE_STATUS.SENT });
    return rgInvites.filter(invite => invite.expiration.getTime() > new Date().getTime());
  }


  async findResearchPendingInvites(researchExternalId) {

    const research = await deipRpc.api.getResearchAsync(researchExternalId);
    const researchGroupExternalId = research.research_group.external_id;

    const invites = await UserInvite.find({
      researchGroupExternalId: researchGroupExternalId,
      status: USER_INVITE_STATUS.SENT,
      $or: [
        { 'researches': { $exists: false } },
        { 'researches': null },
        { 'researches.externalId': { $in: [researchExternalId] } }
      ]
    });

    return invites.filter(invite => invite.expiration.getTime() > new Date().getTime());
  }


  async createUserInvite({
    externalId,
    invitee,
    creator,
    researchGroupExternalId,
    rewardShare,
    status,
    notes,
    researches,
    expiration
  }) {

    const userInvite = new UserInvite({
      _id: externalId,
      invitee,
      creator,
      researchGroupExternalId,
      rewardShare,
      status,
      notes,
      expiration,
      researches,
      failReason: null
    });

    const savedUserInvite = await userInvite.save();
    return savedUserInvite.toObject();
  }


  async updateUserInvite(externalId, {
    status,
    failReason,
  }) {

    const userInvite = await UserInvite.findOne({ _id: externalId });
    userInvite.status = status;
    userInvite.failReason = failReason;

    const updatedUserInvite = await userInvite.save();
    return updatedUserInvite.toObject();
  }
}

export default UserInviteService;