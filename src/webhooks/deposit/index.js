import mongoose from 'mongoose';
import config from './../../config';
import crypto from '@deip/lib-crypto';
import deipRpc from '@deip/rpc-client';
import { TextEncoder } from 'util';
import * as blockchainService from './../../utils/blockchain';

function Encodeuint8arr(seed) {
  return new TextEncoder("utf-8").encode(seed);
}

const Schema = mongoose.Schema;

const AssetDepositRequestSchema = new Schema({
  "currency": { type: String, required: true },
  "amount": { type: Number, required: true },
  "username": { type: String, required: true }, // user who makes a payment
  "account": { type: String, required: true }, // target balance owner
  "requestToken": { type: String, required: true, index: { unique: true } },
  "timestamp": { type: Number, required: true },
  "isConfirmed": { type: Boolean, required: true, default: false },
  "txInfo": { type: Object, required: false }
}, { timestamps: { createdAt: 'created_at', 'updatedAt': 'updated_at' } });


const AssetDepositRequest = mongoose.model('asset-deposit-request', AssetDepositRequestSchema);

const SUPPORTED_CURRENCIES = ["USD", "EUR", "CAD", "CYN", "GBP"];
const MIN_AMOUNT = 1;


const createAssetDepositRequest = async (ctx) => {
  try {
    const {
      currency,
      amount,
      timestamp,
      account,
      sigHex
    } = ctx.request.body;
    const username = ctx.state.user.username;

    if (!currency || !SUPPORTED_CURRENCIES.includes(currency)) {
      ctx.status = 400;
      ctx.body = `${currency} is not supported`;
      return;
    }

    if (!amount || amount < MIN_AMOUNT) {
      ctx.status = 400;
      ctx.body = `Amount to deposit is less than min required amount which is ${MIN_AMOUNT} ${currency}`;
      return;
    }

    // separate queries as api returns a set of accounts
    const [depositor] = await deipRpc.api.getAccountsAsync([username]);
    const [balanceOwner] = await deipRpc.api.getAccountsAsync([account]);
    
    if (!depositor || !balanceOwner) {
      ctx.status = 404;
      ctx.body = `${username} or ${account} account is not found`;
      return;
    }

    try {
      const pubKey = depositor.owner.key_auths[0][0];
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
      currency,
      amount,
      timestamp,
      account,
      username,
      requestToken: sigHex
    })).save();
    const depositRequest = depositRequestDoc.toObject();

    const redirectUrl = `${config.DEIP_PAYMENT_SERVICE_URL}?amount=${amount}&currency=${currency}&username=${username}&account=${account}&requestToken=${depositRequest.requestToken}&serverUrl=${config.DEIP_SERVER_URL}/webhook/assets/emit`;
   
    ctx.status = 200;
    ctx.body = {
      redirectUrl,
      depositRequest
    }
  }

  catch (err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
}


const confirmAssetDepositRequest = async (ctx) => {
  try {
    const {
      sig,
      invoice
    } = ctx.request.body;    

    try {
      const publicKey = crypto.PublicKey.from(config.DEIP_PAYMENT_SERVICE_PUB_KEY);
      const payloadStr = JSON.stringify(invoice, Object.keys(invoice).sort())
      publicKey.verify(Encodeuint8arr(payloadStr).buffer, crypto.unhexify(sig).buffer);
    }
    catch (err) {
      ctx.status = 401;
      ctx.body = `Provided signature is not valid for provided invoice`;
      return;
    }

    const {
      amount_paid: amount,
      currency: currency,
      metadata: {
        account,
        username,
        requestToken
      }
    } = invoice;

    const depositRequestDoc = await AssetDepositRequest.findOne({ requestToken });
    if (!depositRequestDoc) {
      ctx.status = 404;
      ctx.body = `Deposit request with ${requestToken} is not found`;
      return;
    }

    const depositRequest = depositRequestDoc.toObject();
    if (depositRequest.isConfirmed) {
      ctx.status = 400;
      ctx.body = `Deposit request with ${requestToken} has been already confirmed`;
      return;
    }
  
    const { username: regacc, wif: regaccPrivKey } = config.FAUCET_ACCOUNT;

    const issue_asset_op = ['issue_asset', {
      issuer: regacc,
      amount: `${amount}.00 ${currency.toUpperCase()}`,
      recipient: account,
      memo: undefined,
      extensions: []
    }];

    let signedTx = await blockchainService.signOperations([issue_asset_op], regaccPrivKey);
    signedTx = deipRpc.auth.signTransaction(signedTx, {}, { tenant: config.TENANT, tenantPrivKey: config.TENANT_PRIV_KEY }); // affirm by tenant
    const txInfo = await blockchainService.sendTransactionAsync(signedTx);

    depositRequestDoc.isConfirmed = true;
    depositRequestDoc.txInfo = txInfo;

    const confirmedDepositRequest = await depositRequestDoc.save();
    console.log(confirmedDepositRequest.toObject());
    
    ctx.status = 200;
    ctx.body = "OK";
  } 
  catch(err) {
    ctx.status = 500;
    ctx.body = err.message;
  }
}

module.exports = {
  createAssetDepositRequest,
  confirmAssetDepositRequest
}