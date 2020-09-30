import deipRpc from '@deip/rpc-client';
import UserInvite from './../schemas/userInvite';
import { USER_INVITE_STATUS, USER_NOTIFICATION_TYPE, ACTIVITY_LOG_TYPE } from './../constants';


async function findUserInvite(externalId) { // proposal id
  let invite = await UserInvite.findOne({ _id: externalId });
  return invite.toObject();
}


async function findUserActiveInvites(username) {
  let activeInvites = await UserInvite.find({ invitee: username, status: USER_INVITE_STATUS.SENT });
  return activeInvites.filter(invite => invite.expiration.getTime() > new Date().getTime());
}


async function findResearchGroupPendingInvites(researchGroupExternalId) {
  let rgInvites = await UserInvite.find({ researchGroupExternalId: researchGroupExternalId, status: USER_INVITE_STATUS.SENT });
  return rgInvites.filter(invite => invite.expiration.getTime() > new Date().getTime());
}


async function createUserInvite({
  externalId,
  invitee,
  creator,
  researchGroupExternalId,
  rewardShare,
  status,
  notes,
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
    approvedBy: [],
    rejectedBy: [],
    failReason: null
  });

  const savedUserInvite = await userInvite.save();
  return savedUserInvite.toObject();
}


async function updateUserInvite(externalId, {
  status,
  failReason,
  approvedBy,
  rejectedBy
}) {

  const userInvite = await UserInvite.findOne({ _id: externalId });
  userInvite.status = status;
  userInvite.approvedBy = approvedBy;
  userInvite.rejectedBy = rejectedBy;
  userInvite.failReason = failReason;

  const updatedUserInvite = await userInvite.save();
  return updatedUserInvite.toObject();
}

export default {
  findUserInvite,
  findUserActiveInvites,
  findResearchGroupPendingInvites,
  createUserInvite,
  updateUserInvite
}