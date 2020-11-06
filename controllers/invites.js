import { APP_EVENTS } from './../constants';
import UserInviteService from './../services/userInvites';
import * as blockchainService from './../utils/blockchain';


const getUserInvites = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const username = ctx.params.username;
  const userInviteService = new UserInviteService();

  try {

    if (jwtUsername != username) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to view invites for "${username}" research`;
      return;
    }

    const activeInvites = await userInviteService.findUserPendingInvites(username);
    ctx.status = 200;
    ctx.body = activeInvites;
    
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchGroupPendingInvites = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const researchGroupExternalId = ctx.params.researchGroupExternalId;
  const userInviteService = new UserInviteService();

  try {

    const invites = await userInviteService.findResearchGroupPendingInvites(researchGroupExternalId);
    ctx.status = 200;
    ctx.body = invites;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchPendingInvites = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const researchExternalId = ctx.params.researchExternalId;
  const userInviteService = new UserInviteService();

  try {

    const invites = await userInviteService.findResearchPendingInvites(researchExternalId);
    ctx.status = 200;
    ctx.body = invites;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const createUserInvite = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta } = ctx.request.body;

  try {

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const operations = blockchainService.extractOperations(tx);

    const inviteDatum = operations.find(([opName]) => opName == 'join_research_group_membership');

    const [opName, invitePayload, inviteProposal] = inviteDatum;
    ctx.state.events.push([APP_EVENTS.USER_INVITATION_PROPOSED, { opDatum: inviteDatum, context: { emitter: jwtUsername, offchainMeta: { researches: [], ...offchainMeta } } }]);

    const approveInviteDatum = operations.find(([opName, opPayload]) => opName == 'update_proposal' && opPayload.external_id == inviteProposal.external_id);
    if (approveInviteDatum) {
      ctx.state.events.push([APP_EVENTS.USER_INVITATION_SIGNED, { opDatum: approveInviteDatum, context: { emitter: jwtUsername } }]);
    }

    ctx.status = 200;
    ctx.body = invitePayload;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();

};


const approveUserInvite = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try {

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const operations = blockchainService.extractOperations(tx);

    const approveInviteDatum = operations.find(([opName]) => opName == 'update_proposal');
    const [opName, approveInvitePayload] = approveInviteDatum;

    ctx.state.events.push([APP_EVENTS.USER_INVITATION_SIGNED, { opDatum: approveInviteDatum, context: { emitter: jwtUsername } }]);
    
    ctx.status = 200;
    ctx.body = approveInvitePayload;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();

}


const rejectUserInvite = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try {

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const operations = blockchainService.extractOperations(tx);

    const rejectInviteDatum = operations.find(([opName]) => opName == 'delete_proposal');
    const [opName, rejectInvitePayload] = rejectInviteDatum;

    ctx.state.events.push([APP_EVENTS.USER_INVITATION_CANCELED, { opDatum: rejectInviteDatum, context: { emitter: jwtUsername } }]);

    ctx.status = 200;
    ctx.body = rejectInvitePayload;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();

}


export default {
  getUserInvites,
  getResearchPendingInvites,
  getResearchGroupPendingInvites,
  createUserInvite,
  approveUserInvite,
  rejectUserInvite
}