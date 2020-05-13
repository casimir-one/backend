import deipRpc from '@deip/rpc-client';
import UserInvite from './../schemas/userInvite';
import { USER_INVITE_STATUS } from './../constants';


async function findUserInvite(externalId) { // proposal id
  let invite = await UserInvite.findOne({ _id: externalId });
  return invite;
}


async function findUserActiveInvites(username) {
  let activeInvites = await UserInvite.find({ invitee: username, status: USER_INVITE_STATUS.SENT });
  return activeInvites;
}


async function findResearchGroupInvites(researchGroupExternalId) {
  let rgInvites = await UserInvite.find({ researchGroupExternalId: researchGroupExternalId });
  return rgInvites;
}


async function createUserInvite({
  externalId,
  invitee,
  researchGroupExternalId,
  rewardShare,
  status,
  notes,
  expiration
}) {

  const userInvite = new UserInvite({
    _id: externalId,
    invitee,
    researchGroupExternalId,
    rewardShare,
    status,
    notes,
    expiration,
    approvedBy: [],
    rejectedBy: null,
    failReason: null
  });

  return userInvite.save();
}


async function updateUserInvite(externalId, {
  status,
  failReason,
  approvedBy,
  rejectedBy
}) {

  let userInvite = await findUserInvite(externalId);
  userInvite.status = status;
  userInvite.approvedBy = approvedBy;
  userInvite.rejectedBy = rejectedBy;
  userInvite.failReason = failReason;

  return userInvite.save();
}



export default {
  findUserActiveInvites,
  findResearchGroupInvites,
  findUserInvite,
  createUserInvite,
  updateUserInvite
}