
import config from './../config';
import request from 'request';
import util from 'util';
import crypto from '@casimir.one/lib-crypto';
import { TextEncoder } from 'util';

const requestPromise = util.promisify(request);

async function getPortalAccessToken(requestedPortal) {
  const clientPortalId = config.TENANT;
  const requestedPortalId = requestedPortal.id;

  const secretKey = crypto.PrivateKey.from(config.TENANT_PRIV_KEY);
  const secretSig = secretKey.sign(new TextEncoder("utf-8").encode(config.SIG_SEED).buffer);
  const secretSigHex = crypto.hexify(secretSig);

  const options = {
    url: `${requestedPortal.profile.serverUrl}/auth/portal/sign-in`,
    method: "post",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ clientPortalId, secretSigHex })
  };

  const response = await requestPromise(options);
  const res = response.toJSON();
  const { jwtToken : accessToken } = JSON.parse(res.body);
  return accessToken;
}

const waitChainBlockAsync = async (cbAsync = async () => { }, timeout = config.CHAIN_BLOCK_INTERVAL_MILLIS) => {
  await new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        await cbAsync()
        resolve();
      } catch (err) {
        reject(err);
      }
    }, timeout);
  });
}


export {
  getPortalAccessToken,
  waitChainBlockAsync
}