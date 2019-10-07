const CryptoJS = require('crypto-js'); 
const Invite = require('../schemas/invite');
const UserProfile = require('../schemas/user');
const mailer = require('../services/emails');
const { inviteStatus } = require('./../common/enums');

async function sendInvite(senderId, inviteeEmail) {
  if (!senderId || !inviteeEmail) {
    throw new Error('senderId and invitee email are required');
  }
  let invite = await Invite.findOne({
    'invitee.email': inviteeEmail,
    status: inviteStatus.UNSENT
  });
  if (!invite) {
    invite = new Invite({
      sender: senderId,
      invitee: {
        email: inviteeEmail,
        id: null,
      },
      code: CryptoJS.lib.WordArray.random(16).toString(CryptoJS.enc.Hex),
      status: inviteStatus.UNSENT,
    });
    invite = await invite.save();
  }

  const senderProfile = await UserProfile.findById(senderId);

  await mailer.sendInviteEmail(inviteeEmail, {
    senderName: `${senderProfile.firstName} ${senderProfile.lastName}`.trim() || senderProfile._id,
    inviteCode: invite.code,
  });

  await Invite.updateOne({ _id: invite._id }, {
    $set: { status: inviteStatus.PENDING }
  });
}

async function claimInvite(inviteCode) {
  const invite = await Invite.findOne({
    code: inviteCode
  });
  if (!invite) {
    return null;
  }
  if (invite.status === inviteStatus.PENDING) {
    invite.status = inviteStatus.CLAIMED;
    await invite.save();
  }
  return invite;
}

async function acceptInvite(inviteCode, userId) {
  const invite = await Invite.findOneAndUpdate({
    code: inviteCode,
    status: { $ne: inviteStatus.ACCEPTED }
  }, {
    $set: {
      status: inviteStatus.ACCEPTED,
      'invitee.id': userId,
    }
  }, { new: true });
  return invite;
}

export default {
  sendInvite,
  claimInvite,
  acceptInvite
}
