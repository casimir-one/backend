
import { sendTransaction, getTransaction } from './../utils/blockchain';
import { sendInviteNotificationToInvitee } from './../services/notifications';
import { createOrganizationProfile } from './../services/organization';
import deipRpc from '@deip/deip-rpc-client';

const createResearchGroup = async (ctx) => {
  try {

    const jwtUsername = ctx.state.user.username;
    const tx = ctx.request.body.tx;
    const meta = ctx.request.body.meta;
    const operation = tx['operations'][0];
    const payload = operation[1];

    let {
      website,
      fullName,
      country,
      city,
      addressLine1,
      addressLine2,
      zip,
      phoneNumber,
      email,
      members } = meta;

    if (!payload.name || !payload.permlink) {
      ctx.status = 400;
      ctx.body = `Malformed transaction "${tx}`
      return;
    }

    let exists = await deipRpc.api.checkResearchGroupExistenceByPermlinkAsync(payload.permlink);
    if (exists) {
      ctx.status = 409;
      ctx.body = `Organization with permlink ${payload.permlink} already exists`
      return;
    }

    const result = await sendTransaction(tx);
    if (result.isSuccess) {

      try {
        // do not fail if transaction is accepted in the chain
        await createOrganizationProfile(payload.permlink, payload.name, website, fullName, payload.description, country, city, addressLine1, addressLine2, zip, phoneNumber, email, members);
        await processNewGroup(payload, result.txInfo);
      } catch (err) { console.log(err) }

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


async function processNewGroup(payload, txInfo) {
  const transaction = await getTransaction(txInfo.id);
  for (let i = 0; i < transaction.operations.length; i++) {
    const op = transaction.operations[i];
    const opName = op[0];
    const opPayload = op[1];
    if (opName === 'create_research_group' && opPayload.permlink === payload.permlink) {
      const group = await deipRpc.api.getResearchGroupByPermlinkAsync(opPayload.permlink);
      if (group) {
        for (let i = 0; i < opPayload.invitees.length; i++) {
          const invitee = opPayload.invitees[i];
          await sendInviteNotificationToInvitee(group.id, invitee.account);
        }
      }
      break;
    }
  }
}



export default {
  createResearchGroup
}