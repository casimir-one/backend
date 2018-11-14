import deipRpc from '@deip/deip-rpc-client';
import UserProfile from './../schemas/user';
import Notification from './../schemas/notification';

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

export async function sendInvitationNotificationToInvitee(groupId, invitee) {
    const groupInfo = await deipRpc.api.getResearchGroupByIdAsync(groupId);
    const inviteeInfo = await UserProfile.findOne({ '_id': invitee });

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

export async function sendProposalNotificationToGroup(proposal) {
    const notifications = [];

    const group = await deipRpc.api.getResearchGroupByIdAsync(proposal.research_group_id);
    proposal.groupInfo = group;

    if (group.is_personal) return notifications;
    
    if (proposal.action === CREATE_RESEARCH_MATERIAL || 
        proposal.action === START_RESEARCH_TOKEN_SALE) {

        const research = await deipRpc.api.getResearchByIdAsync(proposal.data.research_id);
        proposal.researchInfo = research;
    }

    if (proposal.action === INVITE_MEMBER) {

        const invitee = await UserProfile.findOne({ '_id': proposal.data.name });
        proposal.inviteeInfo = invitee;

        if (proposal.is_completed) {
            const invitation = await sendInvitationNotificationToInvitee(proposal.research_group_id, proposal.data.name);
            notifications.push(invitation);
        }
    }

    const rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(proposal.research_group_id);
    for (let i = 0; i < rgtList.length; i++) {
        const rgt = rgtList[i];
        const creatorProfile = await UserProfile.findOne({ '_id': proposal.creator });
        proposal.creatorInfo = creatorProfile;

        const notification = new Notification({
            username: rgt.owner,
            status: 'unread',
            type: proposal.is_completed ? 'completed-proposal' : 'new-proposal',
            meta: proposal
        });
        const savedNotification = await notification.save();
        notifications.push(savedNotification);
    }

    return notifications;
}