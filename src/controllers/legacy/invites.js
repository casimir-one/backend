import UserInviteService from './../../services/userInvites';
import * as blockchainService from './../../utils/blockchain';
import UserInvitationProposedEvent from './../../events/legacy/userInvitationProposedEvent';
import UserInvitationProposalSignedEvent from './../../events/legacy/userInvitationProposalSignedEvent';


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
    const datums = blockchainService.extractOperations(tx);

    const userInvitationProposedEvent = new UserInvitationProposedEvent(datums, { researches: [], ...offchainMeta });
    ctx.state.events.push(userInvitationProposedEvent);

    const userInvitationApprovals = userInvitationProposedEvent.getProposalApprovals();
    for (let i = 0; i < userInvitationApprovals.length; i++) {
      const approval = userInvitationApprovals[i];
      const userInvitationProposalSignedEvent = new UserInvitationProposalSignedEvent([approval]);
      ctx.state.events.push(userInvitationProposalSignedEvent);
    }

    ctx.status = 200;
    ctx.body = [...ctx.state.events];

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();

};


export default {
  getUserInvites,
  getResearchPendingInvites,
  getResearchGroupPendingInvites,
  createUserInvite
}