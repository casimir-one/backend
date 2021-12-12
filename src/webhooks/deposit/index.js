import config from './../../config';
import qs from 'qs';
import crypto from '@deip/lib-crypto';
import { TextEncoder } from 'util';
import { DEPOSIT_REQUEST_STATUS } from './../../constants';
import AssetDepositRequest from './../../schemas/AssetDepositRequestSchema';
import { ChainService } from '@deip/chain-service';
import { IssueAssetCmd } from '@deip/command-models';
import { AssetDtoService } from './../../services';


const assetDtoService = new AssetDtoService();

function Encodeuint8arr(seed) {
  return new TextEncoder("utf-8").encode(seed);
}

const SUPPORTED_CURRENCIES = ["USD", "EUR", "CAD", "CNY", "GBP"];
const MIN_AMOUNT = 100; // cents


// TEMP until Stipe fix
const processAssetDepositRequestForTestnet = async (ctx) => {
  try {
    const {
      currency,
      amount,
      timestamp,
      account,
      redirectUrl,
      sigHex
    } = ctx.request.body;

    const username = ctx.state.user.username;

    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainNodeClient = chainService.getChainNodeClient();
    const chainTxBuilder = chainService.getChainTxBuilder();

    if (!currency || !SUPPORTED_CURRENCIES.includes(currency)) {
      ctx.status = 400;
      ctx.body = `Asset with symbol ${currency} is not supported`;
      return;
    }

    const asset = await assetDtoService.getAssetBySymbol(currency);
    if (!asset) {
      ctx.status = 400;
      ctx.body = `Asset with symbol ${currency} is not found`;
      return;
    }

    if (!amount || amount < MIN_AMOUNT) {
      ctx.status = 400;
      ctx.body = `Amount to deposit is less than min required amount which is ${(MIN_AMOUNT / 100).toFixed(2)} ${currency}`;
      return;
    }

    const depositor = await chainRpc.getAccountAsync(username);
    const balanceOwner = await chainRpc.getAccountAsync(account);

    if (!depositor || !balanceOwner) {
      ctx.status = 404;
      ctx.body = `${username} or ${account} account is not found`;
      return;
    }

    const { username: regacc, wif: regaccPrivKey } = config.FAUCET_ACCOUNT;
    const tx = await chainTxBuilder.begin()
      .then((txBuilder) => {
        const issueAssetCmd = new IssueAssetCmd({
          issuer: regacc,
          asset: {
            id: asset._id,
            symbol: asset.symbol,
            precision: asset.precision,
            amount: `${(amount / 100).toFixed(2)} ${asset.symbol}`
          },
          recipient: account
        });
        txBuilder.addCmd(issueAssetCmd);
        return txBuilder.end();
      })
      .then((packedTx) => packedTx.signAsync(regaccPrivKey, chainNodeClient));

    await tx.signByTenantAsync({ tenant: config.TENANT, tenantPrivKey: config.TENANT_PRIV_KEY }, chainNodeClient);
    const txInfo = await tx.sendAsync(chainRpc);

    const depositRequestDoc = await (new AssetDepositRequest({
      assetId: asset._id,
      currency,
      amount,
      timestamp,
      account,
      username,
      status: DEPOSIT_REQUEST_STATUS.APPROVED,
      requestToken: sigHex,
      invoice: {},
      txInfo
    })).save();
    const depositRequest = depositRequestDoc.toObject();

    const query = qs.stringify({
      amount,
      currency,
      username,
      account,
      requestToken: depositRequest.requestToken,
      serverUrl: config.DEIP_SERVER_URL,
      referrerUrl: config.DEIP_CLIENT_URL,
      redirectUrl
    });

    const redirectToPaymentUrl = `${config.DEIP_PAYMENT_SERVICE_URL}?${query}`;

    ctx.status = 200;
    ctx.body = {
      redirectUrl: redirectToPaymentUrl,
      depositRequest
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const createAssetDepositRequest = async (ctx) => {
  try {
    const {
      currency,
      amount,
      timestamp,
      account,
      redirectUrl,
      sigHex
    } = ctx.request.body;
    const username = ctx.state.user.username;

    if (!currency || !SUPPORTED_CURRENCIES.includes(currency)) {
      ctx.status = 400;
      ctx.body = `Asset with symbol ${currency} is not supported`;
      return;
    }

    const asset = await assetDtoService.getAssetBySymbol(currency);
    if (!asset) {
      ctx.status = 400;
      ctx.body = `Asset with symbol ${currency} is not found`;
      return;
    }

    if (!amount || amount < MIN_AMOUNT) {
      ctx.status = 400;
      ctx.body = `Amount to deposit is less than min required amount which is ${(MIN_AMOUNT / 100).toFixed(2)} ${currency}`;
      return;
    }

    // separate queries as api returns a set of accounts
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const depositor = await chainRpc.getAccountAsync(username);
    const balanceOwner = await chainRpc.getAccountAsync(account);
    
    if (!depositor || !balanceOwner) {
      ctx.status = 404;
      ctx.body = `${username} or ${account} account is not found`;
      return;
    }

    try {
      // TODO: Support substrate
      const pubKey = depositor.authority.owner.auths
        .filter((auth) => !!auth.pubKey)
        .map((auth) => auth.pubKey)[0];

      const publicKey = crypto.PublicKey.from(pubKey);
      const payload = {
        amount,
        currency,
        account,
        timestamp,
      };
      const payloadStr = JSON.stringify(payload, Object.keys(payload).sort())
      publicKey.verify(Encodeuint8arr(payloadStr).buffer, crypto.unhexify(sigHex).buffer);
    } catch (err) {
      ctx.status = 400;
      ctx.body = `Provided sigHex is not valid for '${username}' account`;
      return;
    }

    const depositRequestDoc = await (new AssetDepositRequest({
      assetId: asset._id,
      currency,
      amount,
      timestamp,
      account,
      username,
      requestToken: sigHex
    })).save();
    const depositRequest = depositRequestDoc.toObject();
    
    const query = qs.stringify({
      amount,
      currency,
      username,
      account,
      requestToken: depositRequest.requestToken,
      serverUrl: config.DEIP_SERVER_URL,
      referrerUrl: config.DEIP_CLIENT_URL,
      redirectUrl
     });

    const redirectToPaymentUrl = `${config.DEIP_PAYMENT_SERVICE_URL}?${query}`;
   
    ctx.status = 200;
    ctx.body = {
      redirectUrl: redirectToPaymentUrl,
      depositRequest
    }
  } catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const confirmAssetDepositRequest = async (ctx) => {
  const {
    sig,
    invoice
  } = ctx.request.body;

  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc();
  const chainNodeClient = chainService.getChainNodeClient();
  const chainTxBuilder = chainService.getChainTxBuilder();

  let depositRequestDoc;
  
  try {

    const {
      amount_paid: amount, // cents
      currency: currency,
      metadata: {
        account,
        username,
        requestToken
      }
    } = invoice;

    depositRequestDoc = await AssetDepositRequest.findOne({ requestToken });
    if (!depositRequestDoc) {
      ctx.status = 404;
      ctx.body = `Deposit request with ${requestToken} is not found`;
      return;
    }

    const depositRequest = depositRequestDoc.toObject();
    if (depositRequest.status != DEPOSIT_REQUEST_STATUS.PENDING) {
      ctx.status = 400;
      ctx.body = `Deposit request with ${requestToken} has been already resolved`;
      return;
    }

    try {
      const publicKey = crypto.PublicKey.from(config.DEIP_PAYMENT_SERVICE_PUB_KEY);
      const payloadStr = JSON.stringify(invoice, Object.keys(invoice).sort())
      publicKey.verify(Encodeuint8arr(payloadStr).buffer, crypto.unhexify(sig).buffer);
    } catch (err) {
      ctx.status = 401;
      ctx.body = `Provided signature is not valid for provided invoice`;
      return;
    }

    const asset = await assetDtoService.getAssetBySymbol(depositRequest.currency.toUpperCase());
    const { username: regacc, wif: regaccPrivKey } = config.FAUCET_ACCOUNT;
    const tx = await chainTxBuilder.begin()
      .then((txBuilder) => {
        const issueAssetCmd = new IssueAssetCmd({
          issuer: regacc,
          asset: {
            id: asset._id,
            symbol: asset.symbol,
            precision: asset.precision,
            amount: `${(amount / 100).toFixed(2)} ${asset.symbol}` 
          },
          recipient: account
        });
        txBuilder.addCmd(issueAssetCmd);
        return txBuilder.end();
      })
      .then((packedTx) => packedTx.signAsync(regaccPrivKey, chainNodeClient));

    await tx.signByTenantAsync({ tenant: config.TENANT, tenantPrivKey: config.TENANT_PRIV_KEY }, chainNodeClient);
    const txInfo = await tx.sendAsync(chainRpc);

    depositRequestDoc.status = DEPOSIT_REQUEST_STATUS.APPROVED;
    depositRequestDoc.txInfo = txInfo;
    depositRequestDoc.invoice = invoice;
    const approvedDepositRequest = await depositRequestDoc.save();

    ctx.status = 200;
    ctx.body = "OK";

  } catch (err) {

    if (depositRequestDoc) {
      depositRequestDoc.status = DEPOSIT_REQUEST_STATUS.REJECTED;
      depositRequestDoc.invoice = invoice;
      const rejectedDepositRequest = await depositRequestDoc.save();
    }

    ctx.status = 500;
    ctx.body = err.message;
  }
}


const getDepositRequestByToken = async (ctx) => {
  try {

    const requestToken = ctx.params.requestToken;
    if (!requestToken) {
      ctx.status = 400;
      ctx.body = `Request token is not specified`;
      return;
    }

    const depositRequestDoc = await AssetDepositRequest.findOne({ requestToken });
    if (!depositRequestDoc) {
      ctx.status = 404;
      ctx.body = `Deposit request with ${requestToken} is not found`;
      return;
    }

    const depositRequest = depositRequestDoc.toObject();
    ctx.status = 200;
    ctx.body = depositRequest;

  } catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
}


module.exports = {
  processAssetDepositRequestForTestnet,
  getDepositRequestByToken,
  createAssetDepositRequest,
  confirmAssetDepositRequest
}