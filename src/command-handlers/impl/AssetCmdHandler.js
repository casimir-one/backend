import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import {
  FTTransferredEvent,
  NFTTransferredEvent,
  FTCreatedEvent,
  NFTCollectionCreatedEvent,
  FTIssuedEvent,
  NFTItemCreatedEvent,
  NFTCollectionMetadataCreatedEvent,
  NFTCollectionMetadataUpdatedEvent,
  NFTItemMetadataDraftCreatedEvent,
  NFTItemMetadataDraftDeletedEvent,
  NFTItemMetadataDraftUpdatedEvent,
  NFTItemMetadataCreatedEvent,
  NFTItemMetadataDraftStatusUpdatedEvent,
  NFTItemMetadataDraftModerationMsgUpdatedEvent
} from './../../events';

class AssetCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const assetCmdHandler = new AssetCmdHandler();

assetCmdHandler.register(APP_CMD.CREATE_NFT_COLLECTION_METADATA, (cmd, ctx) => {
  const { 
    entityId, 
    issuer, 
    attributes,
    issuedByTeam
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NFTCollectionMetadataCreatedEvent({
    entityId,
    issuer,
    attributes,
    issuedByTeam
  }));

});

assetCmdHandler.register(APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_STATUS, (cmd, ctx) => {

  const { _id, status } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NFTItemMetadataDraftStatusUpdatedEvent({ _id, status }));
});

assetCmdHandler.register(APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_MODERATION_MSG, (cmd, ctx) => {

  const { _id, moderationMessage } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NFTItemMetadataDraftModerationMsgUpdatedEvent({ _id, moderationMessage }));
});

assetCmdHandler.register(APP_CMD.UPDATE_NFT_COLLECTION_METADATA, (cmd, ctx) => {
  const {
    _id,
    attributes
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NFTCollectionMetadataUpdatedEvent({
    _id,
    attributes
  }));

});

assetCmdHandler.register(APP_CMD.CREATE_NFT_ITEM_METADATA_DRAFT, (cmd, ctx) => {
  const data = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new NFTItemMetadataDraftCreatedEvent({ ...data, uploadedFiles: ctx.req.files }));
});

assetCmdHandler.register(APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT, (cmd, ctx) => {

  const data = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NFTItemMetadataDraftUpdatedEvent({ ...data, uploadedFiles: ctx.req.files }));
});

assetCmdHandler.register(APP_CMD.DELETE_NFT_ITEM_METADATA_DRAFT, (cmd, ctx) => {

  const { _id } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NFTItemMetadataDraftDeletedEvent({ _id }));
});

assetCmdHandler.register(APP_CMD.CREATE_NFT_ITEM_METADATA, (cmd, ctx) => {
  const data = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NFTItemMetadataCreatedEvent({
    ...data,
    creator: ctx.state.user.username
  }));
});

assetCmdHandler.register(APP_CMD.TRANSFER_FT, (cmd, ctx) => {
// Move to chainDomain ftEventHanller, domain event FT_TRANSFERED

  const transferData = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new FTTransferredEvent(transferData));
});

assetCmdHandler.register(APP_CMD.TRANSFER_NFT, (cmd, ctx) => {
  //Move to chainDomain nftEventHanlder, domain event NFT_ITEM_CREATED

  const transferData = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new NFTTransferredEvent(transferData));
});

assetCmdHandler.register(APP_CMD.CREATE_FT, (cmd, ctx) => {

  const asset = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new FTCreatedEvent(asset));
});

assetCmdHandler.register(APP_CMD.CREATE_NFT_COLLECTION, (cmd, ctx) => {
  // Move to chainDomain nftEventHanlder, domain event NFT_COLLECTION_CREATED

  const asset = cmd.getCmdPayload();
  ctx.state.appEvents.push(new NFTCollectionCreatedEvent(asset));
});

assetCmdHandler.register(APP_CMD.ISSUE_FT, (cmd, ctx) => {
  //TODO: move to chainDomain ftEventHandler, domain event FT_ISSUED
  const asset = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new FTIssuedEvent(asset));
});

assetCmdHandler.register(APP_CMD.CREATE_NFT_ITEM, (cmd, ctx) => {

  const asset = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new NFTItemCreatedEvent(asset));
});

module.exports = assetCmdHandler;