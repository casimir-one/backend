import { authorizeResearchGroup } from './../services/auth'
import { sendProposalNotificationToGroup } from './../services/notifications';
import { findPricingPlan } from './../services/pricingPlans';
import { increaseCertificateExportCounter, findSubscriptionByOwner } from './../services/subscriptions';
import { sendTransaction, getTransaction } from './../utils/blockchain';
import { createTimestampedFileRef } from './../services/fileRef';

import deipRpc from '@deip/deip-rpc-client';

const createResearchProposal = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const tx = ctx.request.body;
  const operation = tx['operations'][0];
  const payload = operation[1];

  const organizationId = parseInt(payload.research_group_id);

  if (isNaN(organizationId)) {
    ctx.status = 400;
    ctx.body = `Mallformed operation: "${operation}"`;
    return;
  }

  try {
    const authorized = await authorizeResearchGroup(organizationId, jwtUsername);
    if (!authorized) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not a member of "${organizationId}" group`
      return;
    }

    /* proposal specific action code */
    const result = await sendTransaction(tx);
    if (result.isSuccess) {
      ctx.status = 201;
    } else {
      throw new Error(`Could not proceed the transaction: ${tx}`);
    }

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const createInviteProposal = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const tx = ctx.request.body;
  const operation = tx['operations'][0];
  const payload = operation[1];

  const organizationId = parseInt(payload.research_group_id);

  if (isNaN(organizationId)) {
    ctx.status = 400;
    ctx.body = `Mallformed operation: "${operation}"`;
    return;
  }

  try {
    const authorized = await authorizeResearchGroup(organizationId, jwtUsername);
    if (!authorized) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not a member of "${organizationId}" group`
      return;
    }

    /* proposal specific action code */

    const result = await sendTransaction(tx);
    if (result.isSuccess) {
      ctx.status = 201;
    } else {
      throw new Error(`Could not proceed the transaction: ${tx}`);
    }

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

const createContentProposal = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const tx = ctx.request.body.tx;
  const fileMeta = ctx.request.body.fileMeta;

  const operation = tx['operations'][0];
  const payload = operation[1];
  const proposal = JSON.parse(payload.data);

  const hash = proposal.content;
  const projectId = proposal.research_id;
  const permlink = proposal.permlink;
  const organizationId = parseInt(payload.research_group_id);
  const filename = fileMeta.filename;
  const size = fileMeta.size;
  const filetype = fileMeta.filetype;

  try {

    if (organizationId == undefined ||
      projectId == undefined ||
      filename == undefined ||
      hash == undefined ||
      size == undefined ||
      filetype == undefined ||
      permlink == undefined) {

      ctx.status = 400;
      ctx.body = `Mallformed operation: "${operation}"`;
      return;
    }

    const authorized = await authorizeResearchGroup(organizationId, jwtUsername);
    if (!authorized) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not a member of "${organizationId}" group`;
      return;
    }

    const subscription = await findSubscriptionByOwner(jwtUsername);
    if (!subscription) {
      ctx.status = 404;
      ctx.body = `Subscription for ${jwtUsername} is not found`;
      return;
    }

    const pricingPlan = await findPricingPlan(subscription.pricingPlan);
    if (!pricingPlan) {
      ctx.status = 404;
      ctx.body = `Pricing plan "${subscription.pricingPlan}" is not found`;
      return;
    }

    const isLimitedPlan = pricingPlan.terms != null && pricingPlan.terms.certificateExport != null;
    if (isLimitedPlan) {
      let limit = pricingPlan.terms.certificateExport.limit;
      let counter = subscription.limits.certificateExport.counter;
      let resetTime = subscription.limits.certificateExport.resetTime;
      if (counter >= limit) {
        ctx.status = 402;
        ctx.body = `Subscription ${subscription._id} for ${jwtUsername} is under "${subscription.pricingPlan}" plan and has reached the limit. The limit will be reset on ${resetTime}`;
        return;
      }
    }

    const result = await sendTransaction(tx);
    if (result.isSuccess) {
      const fileRef = await createTimestampedFileRef(organizationId, projectId, filename, filetype, size, hash, permlink);
      if (isLimitedPlan) {
        await increaseCertificateExportCounter(subscription._id);
      }

      ctx.status = 200;
      ctx.body = fileRef;
    } else {
      throw new Error(`Could not proceed the transaction: ${tx}`);
    }
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}


async function processNewProposal(payload, txInfo) {
  const transaction = await getTransaction(txInfo.id);
  for (let i = 0; i < transaction.operations.length; i++) {
    const op = transaction.operations[i];
    const opName = op[0];
    const opPayload = op[1];
    if (opName === 'create_proposal' && opPayload.data === payload.data) {
      const proposals = await deipRpc.api.getProposalsByResearchGroupIdAsync(opPayload.research_group_id);
      const proposal = proposals.find(p =>
        p.data === payload.data &&
        p.creator === payload.creator &&
        p.action === payload.action &&
        p.expiration_time === payload.expiration_time);

      if (proposal) {
        proposal.data = JSON.parse(proposal.data);
        await sendProposalNotificationToGroup(proposal);
      }
      break;
    }
  }
}

export default {
  createResearchProposal,
  createInviteProposal,
  createContentProposal
}