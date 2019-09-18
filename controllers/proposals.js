import { authorizeResearchGroup } from './../services/auth'
import notifier from './../services/notifications';
import subscriptionsService from './../services/subscriptions';
import { sendTransaction, getTransaction } from './../utils/blockchain';
import filesService from './../services/fileRef';
import usersService from './../services/users';

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
  try {
    const files = ctx.request.body.filesMeta;
    const jwtUsername = ctx.state.user.username;
    const tx = ctx.request.body.tx;
    const operations = tx['operations'];

    const subscription = await subscriptionsService.findSubscriptionByOwner(jwtUsername);
    if (!subscription.isActive) {
      ctx.status = 402;
      ctx.body = `Subscription for ${jwtUsername} has expired`;
      return;
    }

    if (subscription.isLimitedPlan) {
      const limit = subscription.availableCertificatesBySubscription + subscription.availableAdditionalCertificates;
      if (operations.length > limit) {
        ctx.status = 402;
        ctx.body = `Subscription ${subscription.id} for ${jwtUsername} is under "${subscription.pricingPlanId}" plan and has reached the limit.`;
        return;
      }
    }

    const refs = [];
    for (let i = 0; i < files.length; i++) {
      let fileMeta = files[i];
      let operation = operations[i];

      let payload = operation[1];
      let proposal = JSON.parse(payload.data);

      let hash = proposal.content;
      let projectId = proposal.research_id;
      let permlink = proposal.permlink;
      let organizationId = parseInt(payload.research_group_id);
      let filename = fileMeta.filename;
      let size = fileMeta.size;
      let filetype = fileMeta.filetype;

      if (
        organizationId == undefined ||
        projectId == undefined ||
        filename == undefined ||
        hash == undefined ||
        size == undefined ||
        filetype == undefined ||
        permlink == undefined
      ) {
        ctx.status = 400;
        ctx.body = `Mallformed operation: "${operation}"`;
        return;
      }

      refs.push({ organizationId, projectId, filename, filetype, size, hash, permlink });
    }

    const result = await sendTransaction(tx);
    if (result.isSuccess) {
      const filesRefs = await filesService.upsertTimestampedFilesRefs(refs, jwtUsername);
      if (subscription.isLimitedPlan) {
        const subtractFromSubscription = Math.min(files.length, subscription.availableCertificatesBySubscription);
        let subtractFromAdditional = 0;
        if (subtractFromSubscription < files.length) {
          subtractFromAdditional = files.length - subtractFromSubscription;
        }
        const updatedCounters = {};
        if (subtractFromSubscription) {
          updatedCounters.certificates = subscription.availableCertificatesBySubscription - subtractFromSubscription;
        }
        if (subtractFromAdditional) {
          updatedCounters.additionalCertificates = subscription.availableAdditionalCertificates - subtractFromAdditional;
        }
        await subscriptionsService.setSubscriptionCounters(subscription.id, updatedCounters);
      }

      ctx.status = 200;
      ctx.body = filesRefs;
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
        await notifier.sendProposalNotificationToGroup(proposal);
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