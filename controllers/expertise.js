import ExpertiseClaim from './../schemas/expertiseClaim';
import deipRpc from '@deip/rpc-client';
import { getTransaction, sendTransaction } from './../utils/blockchain';
import userNotificationHandler from './../event-handlers/userNotification';
import USER_NOTIFICATION_TYPE from './../constants/userNotificationType';
import qs from 'qs';
import usersService from './../services/users';

const getExpertiseClaims = async (ctx) => {
    const status = ctx.query.status;
    const expertises = await ExpertiseClaim.find(status ? {'status': status} : {})
    ctx.status = 200;
    ctx.body = expertises;
}

const getExpertiseClaimsByUser = async (ctx) => {
    const username = ctx.params.username;
    const expertises = await ExpertiseClaim.find({'username': username})
    ctx.status = 200;
    ctx.body = expertises;
}

const getExpertiseClaimsByUserAndDiscipline = async (ctx) => {
    const username = ctx.params.username;
    const disciplineId = ctx.params.disciplineId;
    const expertises = await ExpertiseClaim.find({'username': username, 'disciplineId': disciplineId})
    ctx.status = 200;
    ctx.body = expertises;
}

const getExpertiseClaimsByDiscipline = async (ctx) => {
    const disciplineId = ctx.params.disciplineId;
    const expertises = await ExpertiseClaim.find({'disciplineId': disciplineId})
    ctx.status = 200;
    ctx.body = expertises;
}

const createExpertiseClaim = async (ctx) => {
    const data = ctx.request.body;
    const tx = data.tx;
    const jwtUsername = ctx.state.user.username;
    
    const operation = tx['operations'][0];
    const payload = operation[1];
    const username = payload.claimer;
    const disciplineId = payload.discipline_id;
    const coverLetter = payload.description;

    if (username != jwtUsername) { // revise this once we've got 'approve' operation working
        ctx.status = 403;
        ctx.body = `You have no permission to create '${username}' expertise claim application`
        return;
    }

    if (!disciplineId || !coverLetter) {
        ctx.status = 404;
        ctx.body = `You must specify discipline you want to claim and provide short cover letter`
        return;
    }

    try {
        const userExpertise = await deipRpc.api.getExpertTokensByAccountNameAsync(username);
        if (userExpertise.some(e => e.discipline_id == disciplineId)) {
            ctx.status = 405;
            ctx.body = `Expert token in ${disciplineId} discipline for "${username}" exists already`
            return;
        }

        const exists = await ExpertiseClaim.count({'username': username, 'disciplineId': disciplineId}) != 0;
        if (exists) {
            ctx.status = 409
            ctx.body = `Expertise claim for "${username}" in discipline ${disciplineId} already exists!`
            return;
        }

        const result = await sendTransaction(tx);
        if (result.isSuccess) {
            const expertiseClaim = new ExpertiseClaim({
                "username": username,
                "disciplineId": disciplineId,
                "coverLetter": coverLetter,
                "status": 'pending',
                "publications": data.publications,
            })
            const savedExpertiseClaim = await expertiseClaim.save()
            ctx.status = 200
            ctx.body = savedExpertiseClaim

        } else {
            throw new Error(`Could not proceed the transaction: ${tx}`);
        }

    } catch(err) {
        console.error(err);
        // rollback
        await ExpertiseClaim.remove({ username: username, disciplineId: disciplineId, status: 'pending' });
        ctx.status = 500
        ctx.body = `Internal server error, please try again later`;
    }
}


const voteForExpertiseClaim = async (ctx) => {
    const tx = ctx.request.body;
    const jwtUsername = ctx.state.user.username;
    
    const operation = tx['operations'][0];
    const payload = operation[1];
    const proposalId = payload.proposal_id;
    const username = payload.voter;

    if (username != jwtUsername) { // revise this once we've got 'approve' operation working
        ctx.status = 403;
        ctx.body = `You have no permission to vote for '${proposalId}' expertise claim application`
        return;
    }
    
    try {
        const expertiseAllocationProposal = await deipRpc.api.getExpertiseAllocationProposalByIdAsync(proposalId);
        if (!expertiseAllocationProposal) {
            ctx.status = 404;
            ctx.body = `Expertise allocation proposal ${proposalId} is not found`
            return;
        }

        const result = await sendTransaction(tx);
        if (result.isSuccess) {
            setTimeout(() => {
                // wait for next block
                processAllocatedExpertise(payload, result.txInfo, expertiseAllocationProposal)
            }, 4000);
            ctx.status = 201;
        } else {
            throw new Error(`Could not proceed the transaction: ${tx}`);
        }

    } catch(err) {
        console.error(err);
        ctx.status = 500
        ctx.body = `Internal server error, please try again later`;
    }
}

// TODO: move this to chain/app event emmiter to forward specific events to event handlers (subscribers)
async function processAllocatedExpertise(payload, txInfo, expertiseProposal) {
    const transaction = await getTransaction(txInfo.id);
    for (let i = 0; i < transaction.operations.length; i++) {
        const op = transaction.operations[i];
        const opName = op[0];
        const opPayload = op[1];
        if (opName === 'vote_for_expertise_allocation_proposal' && 
            opPayload.voter === payload.voter && 
            opPayload.proposal_id == payload.proposal_id) {

            const claimerExpertise = await deipRpc.api.getExpertTokensByAccountNameAsync(expertiseProposal.claimer);

            if (claimerExpertise.some(e => e.discipline_id == expertiseProposal.discipline_id)) {
                const wrapper = await ExpertiseClaim.findOne({ username: expertiseProposal.claimer, disciplineId: expertiseProposal.discipline_id, 'status': 'pending' });
                if (wrapper) {
                    wrapper.status = 'approved';
                    await wrapper.save();
                }

                userNotificationHandler.emit(USER_NOTIFICATION_TYPE.EXPERTISE_ALLOCATED, expertiseProposal);
            }
            break;
        }
    }
}


const getAccountEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const username = ctx.params.username;

  try {

    const records = await deipRpc.api.getAccountEciHistoryAsync(
      username,
      0, // cursor
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = records;

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const getAccountEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const username = ctx.params.username;

  try {

    const stat = await deipRpc.api.getAccountEciStatsAsync(
      username,
      filter.discipline || undefined, 
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const user = await usersService.findUser(username);
    const result = { user, ...stat };

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getAccountsEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {

    const stats = await deipRpc.api.getAccountsEciStatsAsync(
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const users = await Promise.all(stats.map(([name, stat]) => usersService.findUser(stat.account)));

    const result = stats.map(([name, stat], i) => {
      const user = users[i];
      return { user, ...stat };
    });

    result.sort((a, b) => b.eci - a.eci);

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getResearchEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const researchExternalId = ctx.params.research;

  try {

    const records = await deipRpc.api.getResearchEciHistoryAsync(
      researchExternalId,
      0, // cursor
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = records;

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getResearchEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const researchExternalId = ctx.params.research;

  try {

    const stat = await deipRpc.api.getResearchEciStatsAsync(
      researchExternalId,
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = { ...stat };

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getResearchesEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {

    const stats = await deipRpc.api.getResearchesEciStatsAsync(
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = stats;

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getResearchContentEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const researchContentExternalId = ctx.params.researchContent;

  try {

    const records = await deipRpc.api.getResearchContentEciHistoryAsync(
      researchContentExternalId,
      0, // cursor
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = records;

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getResearchContentEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;
  const researchContentExternalId = ctx.params.researchContent;

  try {

    const stat = await deipRpc.api.getResearchContentEciStatsAsync(
      researchContentExternalId,
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = { ...stat };

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getResearchContentsEciStats = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {

    const stats = await deipRpc.api.getResearchContentsEciStatsAsync(
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    const result = stats;

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getDisciplineEciHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {

    const result = await deipRpc.api.getDisciplineEciHistoryAsync(
      filter.discipline || undefined,
      filter.from || undefined,
      filter.to || undefined,
      filter.contribution || undefined,
      filter.criteria || undefined
    );

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getDisciplinesEciStatsHistory = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {

    const result = await deipRpc.api.getDisciplinesEciStatsHistoryAsync(
      filter.from || undefined,
      filter.to || undefined,
      filter.step || undefined
    );

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getDisciplinesEciLastStats = async (ctx) => {

  try {

    const result = await deipRpc.api.getDisciplinesEciLastStatsAsync();

    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}



export default {
    getExpertiseClaims,
    getExpertiseClaimsByUser,
    getExpertiseClaimsByDiscipline,
    getExpertiseClaimsByUserAndDiscipline,
    createExpertiseClaim,
    voteForExpertiseClaim,

    getAccountEciHistory,
    getAccountEciStats,
    getAccountsEciStats,

    getResearchEciHistory,
    getResearchEciStats,
    getResearchesEciStats,

    getResearchContentEciHistory,
    getResearchContentEciStats,
    getResearchContentsEciStats,

    getDisciplineEciHistory,
    getDisciplinesEciStatsHistory,
    getDisciplinesEciLastStats
}