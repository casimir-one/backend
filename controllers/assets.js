import { APP_EVENTS } from './../constants';
import * as blockchainService from './../utils/blockchain';
import AssetExchangeProposedEvent from './../events/assetExchangeProposedEvent';
import AssetExchangeProposalSignedEvent from './../events/assetExchangeProposalSignedEvent';
import AssetExchangeProposalRejectedEvent from './../events/assetExchangeProposalRejectedEvent';
import AssetTransferredEvent from './../events/assetTransferredEvent';
import AssetTransferProposedEvent from './../events/assetTransferProposedEvent';
import AssetTransferProposalSignedEvent from './../events/assetTransferProposalSignedEvent';
import AssetTransferProposalRejectedEvent from './../events/assetTransferProposalRejectedEvent';


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


export default {
  createAssetExchangeRequest,
  createAssetTransferRequest
}