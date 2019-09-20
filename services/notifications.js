const bluebird = require('bluebird');
const deipRpc = require('@deip/deip-rpc-client');
const usersService = require('./users').default;
const mailer = require('./emails');
const sharedFilesService = require('./sharedFiles').default;
const Notification = require('./../schemas/notification');
const { notificationType } = require('./../common/enums');

const START_RESEARCH = 1;
const INVITE_MEMBER = 2;
const DROPOUT_MEMBER = 3;
const SEND_FUNDS = 4;
const START_RESEARCH_TOKEN_SALE = 5;
const REBALANCE_RESEARCH_GROUP_TOKENS = 6;
const CHANGE_QUORUM = 7;
const CHANGE_RESEARCH_REVIEW_SHARE_PERCENT = 8;
const OFFER_RESEARCH_TOKENS = 9;
const CREATE_RESEARCH_MATERIAL = 10;

const shouldSendEmailNotification = (user, type) => {
  return !!user.email && user.notifications.email.includes(type);
}

class NotificationsService {
  constructor() {}

  async sendInviteNotificationToInvitee(groupId, invitee) {
    const [groupInfo, inviteeInfo] = await Promise.all([
      deipRpc.api.getResearchGroupByIdAsync(groupId),
      usersService.findUserById(invitee)
    ]);

    const notification = new Notification({
      username: invitee,
      status: 'unread',
      type: 'invitation',
      meta: {
        groupInfo: groupInfo,
        inviteeInfo: inviteeInfo
      }
    });
    const savedInvitation = await notification.save();
    return savedInvitation;
  }

  async sendInviteResolvedNotificationToGroup(isApproved, invite) {
    const [groupInfo, inviteeInfo, rgtList] = await Promise.all([
      deipRpc.api.getResearchGroupByIdAsync(invite.research_group_id),
      usersService.findUserById(invite.account_name),
      deipRpc.api.getResearchGroupTokensByResearchGroupAsync(invite.research_group_id)
    ]);

    const notifications = [];
    await bluebird.map(rgtList, async (rgt) => {
      if (rgt.owner === invite.account_name) return;

      const notification = new Notification({
        username: rgt.owner,
        status: 'unread',
        type: isApproved ? 'approved-invitation' : 'rejected-invitation',
        meta: {
          groupInfo: groupInfo,
          inviteeInfo: inviteeInfo
        }
      });
      const savedNotification = await notification.save();
      notifications.push(savedNotification);
    }, { concurrency: 20 })

    return notifications;
  }

  async sendProposalNotificationToGroup(proposal) {
    const group = await deipRpc.api.getResearchGroupByIdAsync(proposal.research_group_id);
    proposal.groupInfo = group;

    if (group.is_personal) return [];

    if (
      proposal.action === CREATE_RESEARCH_MATERIAL
      || proposal.action === START_RESEARCH_TOKEN_SALE
    ) {
      const research = await deipRpc.api.getResearchByIdAsync(proposal.data.research_id);
      proposal.researchInfo = research;
    }

    const notifications = [];
    if (proposal.action === INVITE_MEMBER) {
      const invitee = await usersService.findUserById(proposal.data.name);
      proposal.inviteeInfo = invitee;

      if (proposal.is_completed) {
        const invitation = await this.sendInviteNotificationToInvitee(proposal.research_group_id, proposal.data.name);
        notifications.push(invitation);
      }
    }

    const rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(proposal.research_group_id);

    await bluebird.map(rgtList, async (rgt) => {
      const creatorProfile = await usersService.findUserById(proposal.creator);
      proposal.creatorInfo = creatorProfile;

      const notification = new Notification({
        username: rgt.owner,
        status: 'unread',
        type: proposal.is_completed ? 'completed-proposal' : 'new-proposal',
        meta: proposal
      });
      const savedNotification = await notification.save();
      notifications.push(savedNotification);
    }, { concurrency: 20 })

    return notifications;
  }

  async sendNDAContractReceivedNotifications(contractId) {
    try {
      const contract = await deipRpc.api.getNdaContractAsync(contractId);
      const [creator, signee] = await Promise.all([
        usersService.findUserById(contract.party_a),
        usersService.findUserById(contract.party_b)
      ]);
      if (shouldSendEmailNotification(signee, notificationType.NDA_CONTRACT_RECEIVED)) {
        await mailer.sendNewNDAContractEmail(signee.email, {
          contractId,
          senderName: `${creator.firstName} ${creator.lastName}`.trim() || creator._id,
          receiverName: signee.firstName.trim() || signee._id,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async sendNDASignedNotifications(contractId) {
    try {
      const contract = await deipRpc.api.getNdaContractAsync(contractId);
      const [creator, signee] = await Promise.all([
        usersService.findUserById(contract.party_a),
        usersService.findUserById(contract.party_b)
      ]);
      if (shouldSendEmailNotification(creator, notificationType.NDA_CONTRACT_SIGNED)) {
        await mailer.sendNDASignedEmail(creator.email, {
          signeeName: `${signee.firstName} ${signee.lastName}`.trim() || signee._id,
          receiverName: creator.firstName.trim() || creator._id,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async sendNDADeclinedNotifications(contractId) {
    try {
      const contract = await deipRpc.api.getNdaContractAsync(contractId);
      const [creator, signee] = await Promise.all([
        usersService.findUserById(contract.party_a),
        usersService.findUserById(contract.party_b)
      ]);
      if (shouldSendEmailNotification(creator, notificationType.NDA_CONTRACT_DECLINED)) {
        await mailer.sendNDADeclinedEmail(creator.email, {
          signeeName: `${signee.firstName} ${signee.lastName}`.trim() || signee._id,
          receiverName: creator.firstName.trim() || creator._id,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async sendFileSharedNotifications(sharedFileId) {
    try {
      const sharedFile = await sharedFilesService.getSharedFileById(sharedFileId);
      const [sender, receiver] = await Promise.all([
        usersService.findUserById(sharedFile.sender),
        usersService.findUserById(sharedFile.receiver)
      ]);
      if (shouldSendEmailNotification(receiver, notificationType.FILE_SHARED)) {
        await mailer.sendNewFileSharedEmail(receiver.email, {
          sharedFileId,
          receiverName: receiver.firstName.trim() || receiver._id,
          senderName: `${sender.firstName} ${sender.lastName}`.trim() || sender._id,
          fileName: sharedFile.filename,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async sendFileSharingRequestForAccessNotifications(sharedFileId) {
    try {
      const sharedFile = await sharedFilesService.getSharedFileById(sharedFileId);
      const [sender, receiver] = await Promise.all([
        usersService.findUserById(sharedFile.sender),
        usersService.findUserById(sharedFile.receiver)
      ]);
      if (shouldSendEmailNotification(sender, notificationType.FILE_ACCESS_REQUESTED)) {
        await mailer.sendFileSharingRequestForAccessEmail(sender.email, {
          sharedFileId,
          receiverName: sender.firstName.trim() || sender._id,
          requesterName: `${receiver.firstName} ${receiver.lastName}`.trim() || receiver._id,
          fileName: sharedFile.filename,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }

  async sendFileSharingAccessGrantedNotifications(sharedFileId) {
    try {
      const sharedFile = await sharedFilesService.getSharedFileById(sharedFileId);
      const [sender, receiver] = await Promise.all([
        usersService.findUserById(sharedFile.sender),
        usersService.findUserById(sharedFile.receiver)
      ]);
      if (shouldSendEmailNotification(receiver, notificationType.FILE_ACCESS_GRANTED)) {
        await mailer.sendFileSharingAccessGrantedEmail(receiver.email, {
          sharedFileId,
          receiverName: receiver.firstName.trim() || receiver._id,
          grantorName: `${sender.firstName} ${sender.lastName}`.trim() || sender._id,
          fileName: sharedFile.filename,
        });
      }
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = new NotificationsService();
