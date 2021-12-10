import jwt from 'jsonwebtoken';
import config from './../../config';
import { UserDtoService, PortalDtoService } from './../../services';
import { ChainService } from '@deip/chain-service';


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

    const chainService = await ChainService.getInstanceAsync(config);
    const isValidSig = chainService.verifySignature(user.pubKey, config.SIG_SEED, secretSigHex);

    if (!isValidSig) {
      ctx.body = {
        success: false,
        error: 'Wrong email or password. Please try again.'
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
    const portalDtoService = new PortalDtoService();
    const clientTenant = await portalDtoService.getPortal(clientTenantId);
    const chainService = await ChainService.getInstanceAsync(config);
    const isValidSig = chainService.verifySignature(clientTenant.pubKey, config.SIG_SEED, secretSigHex);

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