import jwt from 'jsonwebtoken';
import config from './../../config';
import { UserDtoService } from './../../services';
// import { ChainService } from '@casimir.one/chain-service';
import { sha256 } from '@noble/hashes/sha256';
import secp256k1 from 'secp256k1';


const hexToBytes = (hexString) =>
  Uint8Array.from(hexString.match(/.{1,2}/g).map((byte) => parseInt(byte, 16)));

const bytesToHex = (bytes) =>
  bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');


const signUp = async function (ctx) {
  // TODO: add conditions for free registration
  const portal = ctx.state.portal;
  const jwtToken = jwt.sign({
    username: 'admin',
    portal: portal.id,
    isPortalAdmin: true,
    exp: Math.floor(Date.now() / 1000) + (60 * 24 * 60),
  }, config.JWT_SECRET);

  ctx.status = 307;
  ctx.redirect(`/api/v3/users?authorization=${jwtToken}`);
}


const signIn = async function (ctx) {
  const { username, secretSigHex } = ctx.request.body;
  const portal = ctx.state.portal;

  try {

    const userDtoService = new UserDtoService();
    const user = await userDtoService.getUser(username);
    if (!user || user.portalId != portal.id) {
      ctx.successRes({
        success: false,
        error: `User '${username}' is not a member of '${portal.name}'`
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

    const isValidSig = secp256k1.ecdsaVerify(
      hexToBytes(secretSigHex), 
      sha256(config.SIG_SEED), 
      hexToBytes(user.pubKey)
    );

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
    ctx.errorRes(err);
  }
}

export default {
  signIn, 
  signUp
}