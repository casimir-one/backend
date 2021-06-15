import UserJoinRequestService from './../../services/legacy/userJoinRequests';
import { TeamDtoService } from './../../services';
import * as blockchainService from './../../utils/blockchain';

const getJoinRequestsByGroup = async (ctx) => {
  const researchGroupExternalId = ctx.params.researchGroupExternalId;
  const jwtUsername = ctx.state.user.username;

  try {

    const userJoinRequestService = new UserJoinRequestService();
    const requests = await userJoinRequestService.getJoinRequestsByResearchGroup(researchGroupExternalId);
    ctx.status = 200;
    ctx.body = requests;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getJoinRequestsByUser = async (ctx) => {
  const username = ctx.params.username;
  const jwtUsername = ctx.state.user.username;

  try {

    const userJoinRequestService = new UserJoinRequestService();
    const requests = await userJoinRequestService.getJoinRequestsByUser(username);
    ctx.status = 200;
    ctx.body = requests;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const createJoinRequest = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const { username, researchGroupExternalId, coverLetter } = ctx.request.body;
  const isRequestEmitter = username === jwtUsername;

  try {

    const teamDtoService = new TeamDtoService();
    const userJoinRequestService = new UserJoinRequestService();

    if (!username || !coverLetter) {
      ctx.status = 400;
      ctx.body = `"username", "researchGroupExternalId" and "coverLetter" fields must be specified`
      return;
    }

    if (!isRequestEmitter) {
      ctx.status = 400;
      ctx.body = `Join request should be sent by "${username} account owner`
      return;
    }

    const isAuthorized = await teamDtoService.authorizeTeamAccount(researchGroupExternalId, username);
    if (isAuthorized) {
      ctx.status = 400;
      ctx.body = `"${username}" is member of "${researchGroupExternalId}" group already`;
      return;
    }

    const activeJoinRequest = await userJoinRequestService.getActiveJoinRequestForUser(researchGroupExternalId, username);
    if (activeJoinRequest) {
      ctx.status = 409;
      ctx.body = `"${username}" has active join request for "${researchGroupExternalId}" group already`;
      return;
    }

    const joinRequest = await userJoinRequestService.createJoinRequest({
      username,
      researchGroupExternalId,
      coverLetter,
      status: 'pending'
    });

    ctx.status = 200;
    ctx.body = joinRequest;

  } catch (err) {
    console.log(err);
    ctx.status = 500
    ctx.body = err;
  }
}



const updateJoinRequest = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const data = ctx.request.body;
  const updatedJoinRequest = data.request;
  const tx = data.tx;

  try {

    const userJoinRequestService = new UserJoinRequestService();
    if (!updatedJoinRequest) {
      ctx.status = 400;
      ctx.body = `Expected updated Join Request object, but found ${updatedJoinRequest}`
      return;
    }

    if (tx && updatedJoinRequest.status == 'approved') {
      await blockchainService.sendTransactionAsync(tx);
    }

    const result = await userJoinRequestService.updateJoinRequest(updatedJoinRequest._id, {
      status: updatedJoinRequest.status
    })

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


export default {
  createJoinRequest,
  updateJoinRequest,
  getJoinRequestsByGroup,
  getJoinRequestsByUser
}