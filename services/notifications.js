const bluebird = require('bluebird');
const deipRpc = require('@deip/deip-rpc-client');
const usersService = require('./users').default;
const mailer = require('./emails');
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

  async sendNDAContractReceivedNotificationToUser(userId, contractId) {
    try {
      const user = await usersService.findUserById(userId);
      if (shouldSendEmailNotification(user, notificationType.NDA_CONTRACT_RECEIVED)) {
        await mailer.sendNewNDAContractEmail(user.email, contractId);
      }
    } catch (err) {
      console.error(err);
    }
  }

  async sendFileSharedNotificationToUser(userId, sharedFileId) {
    try {
      const user = await usersService.findUserById(userId);
      if (shouldSendEmailNotification(user, notificationType.FILE_SHARED)) {
        await mailer.sendNewFileSharedEmail(user.email, sharedFileId);
      }
    } catch (err) {
      console.error(err);
    }
  }
}

module.exports = new NotificationsService();
