import config from './../../config';
import qs from 'qs';
import crypto from '@deip/lib-crypto';
import { TextEncoder } from 'util';
import { DepositRequestStatus } from '@casimir/platform-core';
import AssetDepositRequest from './../../schemas/AssetDepositRequestSchema';
import { ChainService } from '@deip/chain-service';
import { IssueFTCmd } from '@deip/commands';
import { UnauthorizedError, BadRequestError, NotFoundError } from './../../errors'; 
import { FTClassDtoService } from './../../services';


const ftClassDtoService = new FTClassDtoService();

function Encodeuint8arr(seed) {
  return new TextEncoder("utf-8").encode(seed);
}

const SUPPORTED_CURRENCIES = ["USD", "EUR", "CAD", "CNY", "GBP"];
const MIN_AMOUNT = 100; // cents


// @temp until Dev Stripe fix
const processAssetDepositRequestForTestnet = async (ctx) => {
  try {
    const {
      currency,
      amount,
      timestamp,
      account,
      redirectUrl,
      sigHex,
      sigSource
    } = ctx.request.body;
    const username = ctx.state.user.username;

    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainNodeClient = chainService.getChainNodeClient();
    const chainTxBuilder = chainService.getChainTxBuilder();

    if (!currency || !SUPPORTED_CURRENCIES.includes(currency)) {
      throw new BadRequestError(`Asset with symbol ${currency} is not supported`);
    }

    const asset = await ftClassDtoService.getFTClassBySymbol(currency);
    if (!asset) {
      throw new BadRequestError(`Asset with symbol ${currency} is not found`);
    }

    if (!amount || amount < MIN_AMOUNT) {
      throw new BadRequestError(`Amount to deposit is less than min required amount which is ${(MIN_AMOUNT / 100).toFixed(2)} ${currency}`);
    }

    const depositor = await chainRpc.getAccountAsync(username);
    const balanceOwner = await chainRpc.getAccountAsync(account);

    if (!depositor || !balanceOwner) {
      throw new NotFoundError(`${username} or ${account} account is not found`);
    }

    const depositorPubKey = depositor.authority.owner.auths
      .filter((auth) => !!auth.pubKey)
      .map((auth) => auth.pubKey)[0];

    const isValidSig = chainService.verifySignature(depositorPubKey, sigSource, sigHex);
    if (!isValidSig) {
      throw new BadRequestError(`Signature ${sigSource} is invalid for public key ${depositorPubKey}`);
    }

    const { username: regacc, wif: regaccPrivKey } = config.FAUCET_ACCOUNT;
    const tx = await chainTxBuilder.begin()
      .then((txBuilder) => {
        const issueAssetCmd = new IssueFTCmd({
          issuer: regacc,
          tokenId: asset._id,
          amount: amount / 100, // cents
          recipient: account
        });
        txBuilder.addCmd(issueAssetCmd);
        return txBuilder.end();
      })
      .then((packedTx) => packedTx.signAsync(regaccPrivKey, chainNodeClient));

    const { tx: trx } = tx.getPayload();
    const verifiedTx = await trx.verifyByPortalAsync({ verificationPubKey: config.TENANT_PORTAL.pubKey, verificationPrivKey: config.TENANT_PORTAL.privKey }, chainNodeClient);
    const txInfo = await chainRpc.sendTxAsync(verifiedTx);

    const depositRequestDoc = await (new AssetDepositRequest({
      assetId: asset._id,
      currency,
      amount,
      timestamp,
      account,
      username,
      status: DepositRequestStatus.APPROVED,
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

    ctx.successRes({
      redirectUrl: redirectToPaymentUrl,
      depositRequest
    });
  } catch (err) {
    ctx.errorRes(err);
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
      sigHex,
      sigSource
    } = ctx.request.body;
    const username = ctx.state.user.username;

    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    if (!currency || !SUPPORTED_CURRENCIES.includes(currency)) {
      throw new BadRequestError(`Asset with symbol ${currency} is not supported`);
    }

    const asset = await ftClassDtoService.getFTClassBySymbol(currency);
    if (!asset) {
      throw new BadRequestError(`Asset with symbol ${currency} is not found`);
    }

    if (!amount || amount < MIN_AMOUNT) {
      throw new BadRequestError(`Amount to deposit is less than min required amount which is ${(MIN_AMOUNT / 100).toFixed(asset.precision)} ${currency}`);
    }

    const depositor = await chainRpc.getAccountAsync(username);
    const balanceOwner = await chainRpc.getAccountAsync(account);
    
    if (!depositor || !balanceOwner) {
      throw new NotFoundError(`${username} or ${account} account is not found`);
    }

    const depositorPubKey = depositor.authority.owner.auths
      .filter((auth) => !!auth.pubKey)
      .map((auth) => auth.pubKey)[0];

    const isValidSig = chainService.verifySignature(depositorPubKey, sigSource, sigHex);
    if (!isValidSig) {
      throw new BadRequestError(`Signature ${sigSource} is invalid for public key ${depositorPubKey}`);
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
   
    ctx.successRes({
      redirectUrl: redirectToPaymentUrl,
      depositRequest
    })
  } catch (err) {
    ctx.errorRes(err);
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
      throw new NotFoundError(`Deposit request with ${requestToken} is not found`);
    }

    const depositRequest = depositRequestDoc.toObject();
    if (depositRequest.status != DepositRequestStatus.PENDING) {
      throw new BadRequestError(`Deposit request with ${requestToken} has been already resolved`);
    }

    try {
      const publicKey = crypto.PublicKey.from(config.DEIP_PAYMENT_SERVICE_PUB_KEY);
      const payloadStr = JSON.stringify(invoice, Object.keys(invoice).sort())
      publicKey.verify(Encodeuint8arr(payloadStr).buffer, crypto.unhexify(sig).buffer);
    } catch (err) {
      throw new UnauthorizedError(`Provided signature is not valid for provided invoice`);
    }

    const asset = await ftClassDtoService.getFTClassBySymbol(depositRequest.currency.toUpperCase());
    const { username: regacc, wif: regaccPrivKey } = config.FAUCET_ACCOUNT;
    const tx = await chainTxBuilder.begin()
      .then((txBuilder) => {

        const issueFTCmd = new IssueFTCmd({
          issuer: regacc,
          tokenId: asset._id,
          amount: amount / 100, // cents
          recipient: account
        });

        txBuilder.addCmd(issueFTCmd);
        return txBuilder.end();
      })
      .then((packedTx) => packedTx.signAsync(regaccPrivKey, chainNodeClient));

    const { tx: trx } = tx.getPayload();
    const verifiedTx = await trx.verifyByPortalAsync({ verificationPubKey: config.TENANT_PORTAL.pubKey, verificationPrivKey: config.TENANT_PORTAL.privKey }, chainNodeClient);
    const txInfo = await chainRpc.sendTxAsync(verifiedTx);

    depositRequestDoc.status = DepositRequestStatus.APPROVED;
    depositRequestDoc.txInfo = txInfo;
    depositRequestDoc.invoice = invoice;
    const approvedDepositRequest = await depositRequestDoc.save();

    ctx.successRes({ message: 'OK' });

  } catch (err) {

    if (depositRequestDoc) {
      depositRequestDoc.status = DepositRequestStatus.REJECTED;
      depositRequestDoc.invoice = invoice;
      const rejectedDepositRequest = await depositRequestDoc.save();
    }

    ctx.errorRes(err);
  }
}


const getDepositRequestByToken = async (ctx) => {
  try {

    const requestToken = ctx.params.requestToken;
    if (!requestToken) {
      throw new BadRequestError(`Request token is not specified`);
    }

    const depositRequestDoc = await AssetDepositRequest.findOne({ requestToken });
    if (!depositRequestDoc) {
      throw new NotFoundError(`Deposit request with ${requestToken} is not found`);
    }

    const depositRequest = depositRequestDoc.toObject();
    ctx.successRes(depositRequest);

  } catch (err) {
    ctx.errorRes(err);
  }
}


module.exports = {
  processAssetDepositRequestForTestnet,
  getDepositRequestByToken,
  createAssetDepositRequest,
  confirmAssetDepositRequest
}