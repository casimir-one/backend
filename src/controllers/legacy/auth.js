import jwt from 'jsonwebtoken';
import config from './../../config';
import crypto from '@deip/lib-crypto';
import { TextEncoder } from 'util';
import { UserDtoService } from './../../services';
import TenantService from './../../services/legacy/tenant';

function Encodeuint8arr(seed) {
  return new TextEncoder("utf-8").encode(seed);
}

const signIn = async function (ctx) {
  const { username, secretSigHex } = ctx.request.body;
  const tenant = ctx.state.tenant;

  try {

    const userDtoService = new UserDtoService();
    const user = await userDtoService.getUser(username);
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
  chunkTenantAccessToken
}