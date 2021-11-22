
import config from './../config';
import request from 'request';
import util from 'util';
import crypto from '@deip/lib-crypto';
import { TextEncoder } from 'util';

const requestPromise = util.promisify(request);

async function getPortalAccessToken(requestedTenant) {
  const clientTenantId = config.TENANT;
  const requestedTenantId = requestedTenant.id;

  const secretKey = crypto.PrivateKey.from(config.TENANT_PRIV_KEY);
  const secretSig = secretKey.sign(new TextEncoder("utf-8").encode(config.SIG_SEED).buffer);
  const secretSigHex = crypto.hexify(secretSig);

  const options = {
    url: `${requestedTenant.profile.serverUrl}/auth/tenant/sign-in`,
    method: "post",
    headers: {
      "content-type": "application/json"
    },
    body: JSON.stringify({ clientTenantId, secretSigHex })
  };

  const response = await requestPromise(options);
  const res = response.toJSON();
  const { jwtToken : accessToken } = JSON.parse(res.body);
  return accessToken;
}

export {
  getPortalAccessToken
}