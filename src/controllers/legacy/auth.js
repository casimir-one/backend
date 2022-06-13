import jwt from 'jsonwebtoken';
import config from './../../config';
import { UserDtoService, PortalDtoService } from './../../services';
import { UnauthorizedError, BadRequestError } from './../../errors';
import { ChainService } from '@deip/chain-service';


const signIn = async function (ctx) {
  const { username, secretSigHex } = ctx.request.body;
  const portal = ctx.state.portal;

  try {

    const userDtoService = new UserDtoService();
    const user = await userDtoService.getUser(username);
    if (!user || user.portalId != portal.id) {
      ctx.successRes({
        success: false,
        error: `User '${username}' is not a member of '${portal.profile.name}'`
      });
      return;
    }

    if (ctx.state.isPortalRoute && !portal.admins.some(name => name == username)) {
      ctx.successRes({
        success: false,
        error: `User "${username}" does not have admin rights`
      });
      return;
    }

    const chainService = await ChainService.getInstanceAsync(config);
    const isValidSig = chainService.verifySignature(user.pubKey, config.SIG_SEED, secretSigHex);

    if (!isValidSig) {
      ctx.successRes({
        success: false,
        error: 'Wrong email or password. Please try again.'
      });
      return;
    }

    const jwtToken = jwt.sign({
      username,
      portal: portal.id,
      isPortalAdmin: portal.admins.some(name => name == username),
      exp: Math.floor(Date.now() / 1000) + (60 * 24 * 60),
    }, config.JWT_SECRET);

    ctx.successRes({
      success: true,
      jwtToken
    });

  } catch (err) {
    console.error(err);
    ctx.errorRes(err);
  }
}

export default {
  signIn
}