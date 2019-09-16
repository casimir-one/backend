
import { sendTransaction, getTransaction } from './../utils/blockchain';
import notifier from './../services/notifications';
import { createOrganizationProfile, findOrganizationByPermlink } from './../services/organization';
import { authorizeResearchGroup } from './../services/auth'
import UserProfile from './../schemas/user';

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
      email
    } = meta;

    let members = [{ name: payload.creator }, ...payload.invitees.map(i => { return { name: i.account } })];

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

        let userProfile = await UserProfile.findOne({ '_id': jwtUsername });
        userProfile.activeOrgPermlink = payload.permlink;
        await userProfile.save();
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


const updateGroupProfile = async (ctx) => {

  try {
    const data = ctx.request.body;
    const permlink = ctx.params.permlink;
    const jwtUsername = ctx.state.user.username;

    const profile = await findOrganizationByPermlink(permlink);
    const group = await deipRpc.api.getResearchGroupByPermlinkAsync(permlink);

    if (!profile || !group) {
      ctx.status = 404;
      ctx.body = `Profile for "${group.permlink}" does not exist!`
      return;
    }

    const authorized = await authorizeResearchGroup(group.id, jwtUsername);
    if (!authorized) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not a member of "${group.permlink}" group.`
      return;
    }

    for (let key in data) {
      if (data.hasOwnProperty(key)) {
        profile[key] = data[key]
      }
    }

    const updatedProfile = await profile.save()
    ctx.status = 200;
    ctx.body = updatedProfile

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getGroupProfile = async (ctx) => {

  try {
    const permlink = ctx.params.permlink;
    const jwtUsername = ctx.state.user.username;

    if (jwtUsername == permlink) {
      // personal group
      ctx.status = 200;
      ctx.body = getOrganizationMock(jwtUsername);
      return;
    }

    const profile = await findOrganizationByPermlink(permlink);
    const group = await deipRpc.api.getResearchGroupByPermlinkAsync(permlink);

    if (!profile || !group) {
      ctx.status = 404;
      ctx.body = `Profile for "${group.permlink}" does not exist!`
      return;
    }

    // const authorized = await authorizeResearchGroup(group.id, jwtUsername);
    // if (!authorized) {
    //   ctx.status = 401;
    //   ctx.body = `"${jwtUsername}" is not a member of "${group.permlink}" group.`
    //   return;
    // }

    ctx.status = 200;
    ctx.body = profile;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
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
          await notifier.sendInviteNotificationToInvitee(group.id, invitee.account);
        }
      }
      break;
    }
  }
}

function getOrganizationMock(username) {
  return {
    "email": "",
    "logo": "default_organization_logo.png",
    "permlink": username,
    "name": username,
    "website": username,
    "fullName": username,
    "description": username,
    "country": "",
    "city": "",
    "addressLine1": "",
    "addressLine2": "",
    "zip": "",
    "phoneNumber": "",
    "members": []
  }
}



export default {
  createResearchGroup,
  updateGroupProfile,
  getGroupProfile
}