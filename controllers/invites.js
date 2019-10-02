import notifier from './../services/notifications'
import Invite from './../schemas/invite'
import invitesService from './../services/invites'
import { inviteStatus } from './../common/enums';
import config from './../config';
import { sendTransaction, getTransaction } from './../utils/blockchain';
import deipRpc from '@deip/deip-rpc-client';
import validator from 'validator';

const approveInvite = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const tx = ctx.request.body;

    const operation = tx['operations'][0];
    const payload = operation[1];
    
    if (payload.owner != jwtUsername) {
        ctx.status = 400;
        ctx.body = `Invite can be accepted only by "${jwtUsername} account`
        return;
    }

    try {
        const invite = await deipRpc.api.getResearchGroupInviteByIdAsync(payload.research_group_invite_id);
        const result = await sendTransaction(tx);
        if (result.isSuccess) {
            await processResolvedInvite(true, invite, result.txInfo);
            ctx.status = 201;
        } else {
            throw new Error(`Could not proceed the transaction: ${tx}`);
        }
    } catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}


const rejectInvite = async (ctx) => {
    const jwtUsername = ctx.state.user.username;
    const tx = ctx.request.body;

    const operation = tx['operations'][0];
    const payload = operation[1];
    
    if (payload.owner != jwtUsername) {
        ctx.status = 400;
        ctx.body = `Invite can be accepted only by "${jwtUsername} account`
        return;
    }

    try {
        const invite = await deipRpc.api.getResearchGroupInviteByIdAsync(payload.research_group_invite_id);
        const result = await sendTransaction(tx);
        if (result.isSuccess) {
            await processResolvedInvite(false, invite, result.txInfo);
            ctx.status = 201;
        } else {
            throw new Error(`Could not proceed the transaction: ${tx}`);
        }
    } catch(err) {
        console.log(err);
        ctx.status = 500;
        ctx.body = err.message;
    }
}


async function processResolvedInvite(isApproved, invite, txInfo) {
    const transaction = await getTransaction(txInfo.id);
    const payloadOpName = isApproved ? 'approve_research_group_invite' : 'reject_research_group_invite';
    for (let i = 0; i < transaction.operations.length; i++) {
        const op = transaction.operations[i];
        const opName = op[0];
        const opPayload = op[1];
        if (opName === payloadOpName && opPayload.research_group_invite_id == invite.id) {
            await notifier.sendInviteResolvedNotificationToGroup(isApproved, invite)
            break;
        }
    }
}

const validateInviteEmail = async (email) => {
  if (!validator.isEmail(email)) {
    return `Invalid email: ${email}`;
  }

  const isInviteSent = await Invite.exists({
    'invitee.email': email,
    status: { $ne: inviteStatus.UNSENT },
  });
  if (isInviteSent) {
    return `Invite to ${email} already sent`;
  }

  return null;
};

const sendInvite = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  try {
    const inviteeEmails = ctx.request.body.emails || [];
    if (!inviteeEmails.length) {
      ctx.status = 400;
      ctx.body = 'Provide at leaste one invitee email';
      return;
    } else if (inviteeEmails.length > 50) {
      ctx.status = 400;
      ctx.body = 'Too many emails';
      return;
    }
  
    const errors = [];
    await Promise.all(inviteeEmails.map(async (email) => {
      const validationError = await validateInviteEmail(email);
      if (validationError) {
        errors.push(validationError);
      }
    }));
    if (errors.length) {
      ctx.status = 400;
      ctx.body = errors;
      return;
    } 

    await Promise.all(inviteeEmails.map(email => invitesService.sendInvite(jwtUsername, email)));

    ctx.status = 204;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

const claimInvite = async (ctx) => {
  try {
    const invite = await invitesService.claimInvite(ctx.params.code);
    if (!invite) {
      ctx.status = 404;
      return;
    }
    
    ctx.redirect(`${config.uiHost}/sign-up?invite_code=${invite.code}&email=${invite.invitee.email}`);
  } catch (err) {
    console.log(err);
    ctx.status = 500;
  }
};

const getInvites = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  try {
    ctx.status = 200;
    ctx.body = await Invite.find({
      sender: jwtUsername,
      status: { $ne: inviteStatus.UNSENT }
    }, {
      code: 0,
    });
  } catch (err) {
    console.log(err);
    ctx.status = 500;
  }
};

export default {
  approveInvite,
  rejectInvite,
  sendInvite,
  claimInvite,
  getInvites
}