import { sendTransaction, getTransaction } from './../utils/blockchain';
import researchGroupActivityLogHandler from './../event-handlers/researchGroupActivityLog';
import userNotificationHandler from './../event-handlers/userNotification';
import { USER_NOTIFICATION_TYPE, ACTIVITY_LOG_TYPE, USER_INVITE_STATUS } from './../constants';
import userInvitesService from './../services/userInvites';
import * as blockchainService from './../utils/blockchain';
import * as authService from './../services/auth';
import deipRpc from '@deip/rpc-client';


const getUserInvites = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;

  try {

    if (jwtUsername != username) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to view invites for "${username}" research`;
      return;
    }

    const activeInvites = await userInvitesService.findUserActiveInvites(username);
    ctx.status = 200;
    ctx.body = activeInvites;
    
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchGroupInvites = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const researchGroupExternalId = ctx.params.researchGroupExternalId;

  try {

    const authorizedGroup = await authService.authorizeResearchGroupAccount(researchGroupExternalId, jwtUsername);
    if (!authorizedGroup) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not a member of "${researchGroupExternalId}" research group`
      return;
    }

    const invites = await userInvitesService.findResearchGroupInvites(researchGroupExternalId);
    ctx.status = 200;
    ctx.body = invites;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}



const inviteUser = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta } = ctx.request.body;

  try {

    const proposalOp = tx['operations'][0];
    const inviteOp = tx['operations'][0][1]['proposed_ops'][0]['op'];

    const proposalPayload = proposalOp[1];
    const invitePayload = inviteOp[1];

    const {
      external_id: externalId,
      expiration_time: expiration
    } = proposalPayload;

    const {
      research_group: researchGroupExternalId,
      member: invitee,
      reward_share: rewardShare
    } = invitePayload;

    const {
      notes
    } = offchainMeta;

    const authorizedGroup = await authService.authorizeResearchGroupAccount(researchGroupExternalId, jwtUsername);
    if (!authorizedGroup) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not a member of "${researchGroupExternalId}" research group`
      return;
    }

    const researchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
    const txResult = await blockchainService.sendTransactionAsync(tx);
    const userInvite = await userInvitesService.createUserInvite({
      externalId,
      invitee,
      researchGroupExternalId,
      rewardShare,
      status: USER_INVITE_STATUS.PROPOSED,
      notes,
      expiration
    });


    // LEGACY >>>
    const parsedProposal = {
      research_group_id: researchGroup.id,
      action: deipRpc.formatter.getOperationTag("join_research_group_membership"),
      creator: jwtUsername,
      data: {
        name: invitee
      },
      isProposalAutoAccepted: false
    };

    userNotificationHandler.emit(USER_NOTIFICATION_TYPE.PROPOSAL, parsedProposal);
    researchGroupActivityLogHandler.emit(ACTIVITY_LOG_TYPE.PROPOSAL, parsedProposal);
    // <<< LEGACY

    ctx.status = 201;
    ctx.body = { rm: userInvite, txResult };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
};



export default {
  getUserInvites,
  getResearchGroupInvites,
  inviteUser
}