import jwt from 'jsonwebtoken';
import config from './../../config';
import crypto from '@deip/lib-crypto';
import { TextEncoder } from 'util';
import { TeamService } from './../../services';
import UserService from './../../services/legacy/users';
import TenantService from './../../services/legacy/tenant';
import { USER_PROFILE_STATUS, SIGN_UP_POLICY } from './../../constants';
import AttributesService from './../../services/legacy/attributes';
import { ATTRIBUTE_SCOPE } from '@deip/attributes-service';

function Encodeuint8arr(seed) {
  return new TextEncoder("utf-8").encode(seed);
}

const signIn = async function (ctx) {
  const { username, secretSigHex } = ctx.request.body;
  const tenant = ctx.state.tenant;

  try {

    const usersService = new UserService();
    const user = await usersService.getUser(username);
    if (!user || user.tenantId != tenant.id) {
      ctx.body = {
        success: false,
        error: `User '${username}' is not a member of '${tenant.profile.name}'`
      };
      return;
    }

    if (ctx.state.isTenantRoute && !tenant.admins.some(name => name == username)) {
      ctx.body = {
        success: false,
        error: `User "${username}" does not have admin rights`
      };
      return;
    }

    const pubWif = user.account.owner.key_auths[0][0]
    const publicKey = crypto.PublicKey.from(pubWif);

    let isValidSig;
    try {
      // SIG_SEED should be uint8 array with length = 32
      isValidSig = publicKey.verify(Encodeuint8arr(config.SIG_SEED).buffer, crypto.unhexify(secretSigHex).buffer);
    } catch (err) {
      isValidSig = false;
    }

    if (!isValidSig) {
      ctx.body = {
        success: false,
        error: `Signature is invalid for ${username}, make sure you specify correct private key`
      };
      return;
    }

    const jwtToken = jwt.sign({
      username,
      tenant: tenant.id,
      isTenantAdmin: tenant.admins.some(name => name == username),
      exp: Math.floor(Date.now() / 1000) + (60 * 24 * 60),
    }, config.JWT_SECRET);

    ctx.status = 200;
    ctx.body = {
      success: true,
      jwtToken
    };

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const signUp = async function (ctx, next) {
  const tenant = ctx.state.tenant;
  const { 
    username, 
    email, 
    attributes,
    pubKey,
    role
  } = ctx.request.body;

  try {

    const usersService = new UserService();
    const teamService = new TeamService();
    const attributesService = new AttributesService()

    if (!username || !pubKey || !email || !/^[a-z][a-z0-9\-]+[a-z0-9]$/.test(username)) {
      ctx.status = 400;
      ctx.body = `'username', 'pubKey', 'email', fields are required. Username allowable symbols are: [a-z0-9] `;
      return;
    }

    if (role && !tenant.profile.settings.roles.some((appRole) => appRole.role == role)) {
      ctx.status = 400;
      ctx.body = `'${role}' role is not valid for ${tenant.id} tenant`;
      return;
    }

    const existingProfile = await usersService.findUserProfileByOwner(username);
    if (existingProfile) {
      ctx.status = 409;
      ctx.body = `Profile for '${username}' is under consideration or has been approved already`;
      return;
    }

    const status = tenant.profile.settings.signUpPolicy == SIGN_UP_POLICY.FREE || ctx.state.isTenantAdmin
      ? USER_PROFILE_STATUS.APPROVED
      : USER_PROFILE_STATUS.PENDING;

    const userProfile = await usersService.createUserProfile({
      username,
      status,
      signUpPubKey: pubKey,
      tenant: tenant.id,
      email,
      attributes,
      roles: role ? [{
        role: role,
        researchGroupExternalId: tenant.id
      }] : undefined
    });


    if (status == USER_PROFILE_STATUS.APPROVED) {
      const tx = await usersService.createUserAccount({ username, pubKey, role });

      const attrs = await attributesService.getAttributesByScope(ATTRIBUTE_SCOPE.TEAM);
      const attr = attrs.find(
        ({ type, title }) => title === 'Name' && type === ATTRIBUTE_TYPE.TEXT
      );
  
      const attributes = attr ? [{attributeId: attr._id, value: username}] : [];
  
      await teamService.createTeam({
        externalId: username,
        creator: username,
        attributes
      });

      /* Temp solution for ACTION PROJECT roles setup flow */

      // const datums = blockchainService.extractOperations(tx);
      // if (datums.length > 1) {
      //   const userInvitationProposedEvent = new UserInvitationProposedEvent(datums);
      //   ctx.state.events.push(userInvitationProposedEvent);

      //   const userInvitationApprovals = userInvitationProposedEvent.getProposalApprovals();
      //   for (let i = 0; i < userInvitationApprovals.length; i++) {
      //     const approval = userInvitationApprovals[i];
      //     const userInvitationProposalSignedEvent = new UserInvitationProposalSignedEvent([approval]);
      //     ctx.state.events.push(userInvitationProposalSignedEvent);
      //   }
      // }
    }

    ctx.status = 200;
    ctx.body = { profile: userProfile };

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}

const chunkTenantAccessToken = async function (ctx) {
  const { clientTenantId, secretSigHex } = ctx.request.body;
  const { id: currentTenantId } = ctx.state.tenant;

  try {
    const tenantService = new TenantService();
    const clientTenant = await tenantService.getTenant(clientTenantId);
    
    const pubWif = clientTenant.account.owner.key_auths.map(([key, threshold]) => key)[0];
    const publicKey = crypto.PublicKey.from(pubWif);

    let isValidSig;
    try {
      // SIG_SEED should be uint8 array with length = 32
      isValidSig = publicKey.verify(Encodeuint8arr(config.SIG_SEED).buffer, crypto.unhexify(secretSigHex).buffer);
    } catch (err) {
      isValidSig = false;
    }

    if (!isValidSig) {
      ctx.status = 401;
      ctx.body = `Signature from '${clientTenantId}' tenant is not valid`;
      return;
    }

    const jwtToken = jwt.sign({
      username: clientTenantId, 
      tenant: currentTenantId,
      isTenant: true,
      exp: Math.floor(Date.now() / 1000) + (60 * 24 * 60),
    }, config.JWT_SECRET);

    ctx.status = 200;
    ctx.body = { jwtToken };
    
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

export default {
  signIn,
  signUp,
  chunkTenantAccessToken
}