import * as blockchainService from './../../utils/blockchain';
import AssetExchangeProposedEvent from './../../events/legacy/assetExchangeProposedEvent';
import AssetExchangeProposalSignedEvent from './../../events/legacy/assetExchangeProposalSignedEvent';
import AssetTransferredEvent from './../../events/legacy/assetTransferredEvent';
import AssetTransferProposedEvent from './../../events/legacy/assetTransferProposedEvent';
import AssetTransferProposalSignedEvent from './../../events/legacy/assetTransferProposalSignedEvent';
import AssetService from './../../services/legacy/asset';

const assetService = new AssetService();

const createAssetTransferRequest = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta } = ctx.request.body;

  try {

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    if (datums.some(([opName]) => opName == 'create_proposal')) {
      const assetTransferProposedEvent = new AssetTransferProposedEvent(datums);
      ctx.state.events.push(assetTransferProposedEvent);

      const assetTransferApprovals = assetTransferProposedEvent.getProposalApprovals();
      for (let i = 0; i < assetTransferApprovals.length; i++) {
        const approval = assetTransferApprovals[i];
        const assetTransferProposalSignedEvent = new AssetTransferProposalSignedEvent([approval]);
        ctx.state.events.push(assetTransferProposalSignedEvent);
      }
    } else {
      const assetTransferredEvent = new AssetTransferredEvent(datums);
      ctx.state.events.push(assetTransferredEvent);
    }

    ctx.status = 200;
    ctx.body = [...ctx.state.events];

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
};


const createAssetExchangeRequest = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta } = ctx.request.body;

  try {

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    const assetExchangeProposedEvent = new AssetExchangeProposedEvent(datums);
    ctx.state.events.push(assetExchangeProposedEvent);

    const assetExchangeApprovals = assetExchangeProposedEvent.getProposalApprovals();
    for (let i = 0; i < assetExchangeApprovals.length; i++) {
      const approval = assetExchangeApprovals[i];
      const assetExchangeProposalSignedEvent = new AssetExchangeProposalSignedEvent([approval]);
      ctx.state.events.push(assetExchangeProposalSignedEvent);
    }

    ctx.status = 200;
    ctx.body = [...ctx.state.events];

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();

};

const getAssetById = async (ctx) => {
  const assetId = ctx.params.assetId;
  try {
    const asset = await assetService.getAssetById(assetId);
    if (!asset) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = asset;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getAssetBySymbol = async (ctx) => {
  const symbol = ctx.params.symbol;
  try {
    const assets = await assetService.getAssetBySymbol(symbol);
    if (!assets) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = assets;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getAssetsByType = async (ctx) => {
  const type = ctx.params.type;
  try {
    const assets = await assetService.getAssetsByType(type);
    if (!assets) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = assets;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getAssetsByIssuer = async (ctx) => {
  const issuer = ctx.params.issuer;
  try {
    const assets = await assetService.getAssetsByIssuer(issuer);
    if (!assets) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = assets;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const lookupAssets = async (ctx) => {
  const { lowerBoundSymbol, limit } = ctx.params;
  try {
    const assets = await assetService.lookupAssets(lowerBoundSymbol, limit);
    if (!assets) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = assets;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getAccountAssetBalance = async (ctx) => {
  const { owner, symbol } = ctx.params;
  try {
    const asset = await assetService.getAccountAssetBalance(owner, symbol);
    if (!asset) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = asset;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getAccountAssetsBalancesByOwner = async (ctx) => {
  const owner = ctx.params.owner;
  try {
    const asset = await assetService.getAccountAssetsBalancesByOwner(owner);
    if (!asset) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = asset;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getAccountsAssetBalancesByAsset = async (ctx) => {
  const symbol = ctx.params.symbol;
  try {
    const assets = await assetService.getAccountsAssetBalancesByAsset(symbol);
    if (!assets) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    ctx.body = assets;
    ctx.status = 200;
  }
  catch(err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

export default {
  createAssetExchangeRequest,
  createAssetTransferRequest,
  getAssetById,
  getAssetBySymbol,
  getAssetsByType,
  getAssetsByIssuer,
  lookupAssets,
  getAccountAssetBalance,
  getAccountAssetsBalancesByOwner,
  getAccountsAssetBalancesByAsset
}