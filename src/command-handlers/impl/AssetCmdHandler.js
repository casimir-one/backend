import { APP_CMD } from '@casimir.one/platform-core';
import BaseCmdHandler from './../base/BaseCmdHandler';
import {
  FTTransferredEvent,
  NFTTransferredEvent,
  FTCreatedEvent,
  FTIssuedEvent,
  NFTCollectionCreatedEvent,
  NFTCollectionUpdatedEvent,
  NFTItemCreatedEvent,
  NFTItemDeletedEvent,
  NFTItemUpdatedEvent,
  NFTItemModeratedEvent,
} from './../../events';

class AssetCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const assetCmdHandler = new AssetCmdHandler();

assetCmdHandler.register(APP_CMD.CREATE_NFT_COLLECTION, (cmd, ctx) => {
  const { 
    entityId, 
    ownerId, 
    attributes,
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NFTCollectionCreatedEvent({
    entityId,
    ownerId,
    attributes,
  }));

});

assetCmdHandler.register(APP_CMD.UPDATE_NFT_COLLECTION, (cmd, ctx) => {
  const {
    _id,
    attributes
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NFTCollectionUpdatedEvent({
    _id,
    attributes
  }));

});

assetCmdHandler.register(APP_CMD.CREATE_NFT_ITEM, (cmd, ctx) => {
  const data = cmd.getCmdPayload();
  ctx.state.appEvents.push(new NFTItemCreatedEvent({ ...data, uploadedFiles: ctx.req.files }));
});

assetCmdHandler.register(APP_CMD.UPDATE_NFT_ITEM, (cmd, ctx) => {
  const data = cmd.getCmdPayload();
  ctx.state.appEvents.push(new NFTItemUpdatedEvent({ ...data, uploadedFiles: ctx.req.files }));
});

assetCmdHandler.register(APP_CMD.DELETE_NFT_ITEM, (cmd, ctx) => {
  const { _id } = cmd.getCmdPayload();
  ctx.state.appEvents.push(new NFTItemDeletedEvent({ _id }));
});

assetCmdHandler.register(APP_CMD.MODERATE_NFT_ITEM, (cmd, ctx) => {
  const { _id, status } = cmd.getCmdPayload();
  ctx.state.appEvents.push(new NFTItemModeratedEvent({ _id, status }));
});


assetCmdHandler.register(APP_CMD.TRANSFER_FT, (cmd, ctx) => {
// Move to chainDomain ftEventHanller, domain event FT_TRANSFERED

  const transferData = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new FTTransferredEvent(transferData));
});

assetCmdHandler.register(APP_CMD.TRANSFER_NFT, (cmd, ctx) => {
  const transferData = cmd.getCmdPayload();
  ctx.state.appEvents.push(new NFTTransferredEvent(transferData));
});

assetCmdHandler.register(APP_CMD.CREATE_FT, (cmd, ctx) => {

  const asset = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new FTCreatedEvent(asset));
});

assetCmdHandler.register(APP_CMD.ISSUE_FT, (cmd, ctx) => {
  //TODO: move to chainDomain ftEventHandler, domain event FT_ISSUED
  const asset = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new FTIssuedEvent(asset));
});

module.exports = assetCmdHandler;