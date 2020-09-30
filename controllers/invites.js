import { APP_EVENTS } from './../constants';
import userInvitesService from './../services/userInvites';
import * as blockchainService from './../utils/blockchain';


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


const getResearchGroupPendingInvites = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const researchGroupExternalId = ctx.params.researchGroupExternalId;

  try {

    const invites = await userInvitesService.findResearchGroupPendingInvites(researchGroupExternalId);
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

    const inviteDatum = operations.find(([opName, ...rest]) => opName == 'join_research_group_membership');
    const approveInviteDatum = operations.find(([opName, ...rest]) => opName == 'update_proposal');

    ctx.state.events.push([APP_EVENTS.USER_INVITATION_CREATED, { opDatum: inviteDatum, context: { emitter: jwtUsername, offchainMeta } }]);

    if (approveInviteDatum) {
      ctx.state.events.push([APP_EVENTS.USER_INVITATION_SIGNED, { opDatum: approveInviteDatum, context: { emitter: jwtUsername } }]);
    }

    const [opName, invitePayload] = inviteDatum;

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
  getResearchGroupPendingInvites,
  createUserInvite,
  approveUserInvite,
  rejectUserInvite
}