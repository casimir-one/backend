import deipRpc from '@deip/rpc-client';
import UserInvite from './../schemas/userInvite';
import { USER_INVITE_STATUS, USER_NOTIFICATION_TYPE, ACTIVITY_LOG_TYPE } from './../constants';


async function findUserInvite(externalId) { // proposal id
  let invite = await UserInvite.findOne({ _id: externalId });
  return invite;
}


async function findUserActiveInvites(username) {
  let activeInvites = await UserInvite.find({ invitee: username, status: USER_INVITE_STATUS.SENT });
  return activeInvites;
}


async function findResearchGroupPendingInvites(researchGroupExternalId) {
  let rgInvites = await UserInvite.find({ researchGroupExternalId: researchGroupExternalId, status: USER_INVITE_STATUS.SENT });
  return rgInvites;
}


async function createUserInvite({
  externalId,
  invitee,
  researchGroupExternalId,
  rewardShare,
  status,
  notes,
  expiration,
  approvedBy
}) {

  const userInvite = new UserInvite({
    _id: externalId,
    invitee,
    researchGroupExternalId,
    rewardShare,
    status,
    notes,
    expiration,
    approvedBy: approvedBy,
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


async function approveUserInvite(inviteId, signer, isProposal) {

  const userInvite = await findUserInvite(inviteId);
  if (!userInvite) throw new Error(`${inviteId} invite does not exist`);

  const proposal = await deipRpc.api.getProposalAsync(inviteId);

  if (signer == userInvite.invitee) { // invitee should be the last who approves the invite before it executes

    const approvedInvite = await updateUserInvite(inviteId, {
      status: USER_INVITE_STATUS.APPROVED,
      approvedBy: [...userInvite.approvedBy, signer]
    });

    return approvedInvite;

  } else {

    if (proposal.fail_reason && proposal.fail_reason != userInvite.failReason) {
      const failedInvite = await updateUserInvite(inviteId, {
        status: userInvite.status,
        failReason: proposal.fail_reason,
        approvedBy: [...userInvite.approvedBy, signer]
      });

      return failedInvite;
    }

    const [researchGroupAccount] = await deipRpc.api.getAccountsAsync([proposal.creator]);

    const ownerWeight = researchGroupAccount.owner.account_auths.reduce((acc, [name, threshold]) => {
      return proposal.available_owner_approvals.some(u => u == name) ? acc + threshold : acc;
    }, 0);

    const activeWeight = researchGroupAccount.active.account_auths.reduce((acc, [name, threshold]) => {
      return proposal.available_active_approvals.some(u => u == name) ? acc + threshold : acc;
    }, 0);

    const isAuthorized = ownerWeight >= researchGroupAccount.owner.weight_threshold || activeWeight >= researchGroupAccount.active.weight_threshold;

    if (isAuthorized && userInvite.status != USER_INVITE_STATUS.SENT) {
      const sentInvite = await updateUserInvite(inviteId, {
        status: USER_INVITE_STATUS.SENT,
        approvedBy: [...userInvite.approvedBy, signer]
      });

      return sentInvite;

    } else {

      return userInvite;
    }
  }
}


async function rejectUserInvite(inviteId, signer) {
  const userInvite = await findUserInvite(inviteId);
  if (!userInvite) throw new Error(`${inviteId} invite does not exist`);

  const rejectedInvite = await updateUserInvite(inviteId, {
    status: USER_INVITE_STATUS.REJECTED,
    rejectedBy: signer,
    approvedBy: [...userInvite.approvedBy]
  });

  return rejectedInvite;
}


export default {
  findUserInvite,
  findUserActiveInvites,
  findResearchGroupPendingInvites,
  createUserInvite,
  updateUserInvite,
  approveUserInvite,
  rejectUserInvite
}