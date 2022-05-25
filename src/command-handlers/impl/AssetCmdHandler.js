import { APP_CMD } from '@deip/constants';
import { PROJECT_STATUS } from './../../constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import {
  FungibleTokenTransferedEvent,
  NonFungibleTokenTransferedEvent,
  FungibleTokenCreatedEvent,
  NftCollectionCreatedEvent,
  FungibleTokenIssuedEvent,
  NftItemIssuedEvent,
  NftCollectionMetadataCreatedEvent,
  NftCollectionMetadataUpdatedEvent,
  NftItemMetadataDraftCreatedEvent,
  NftItemMetadataDraftDeletedEvent,
  NftItemMetadataDraftUpdatedEvent,
  NftItemMetadataCreatedEvent,
  ProjectContentStatusUpdatedEvent,
  ProjectContentMetadataUpdatedEvent,
  NftItemMetadataDraftStatusUpdatedEvent,
  NftItemMetadataDraftModerationMsgUpdatedEvent
} from './../../events';

class AssetCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const assetCmdHandler = new AssetCmdHandler();

assetCmdHandler.register(APP_CMD.CREATE_NFT_COLLECTION_METADATA, (cmd, ctx) => {
  const { 
    entityId: nftCollectionId, 
    issuer, 
    attributes,
    isDefault
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NftCollectionMetadataCreatedEvent({
    nftCollectionId,
    issuer,
    attributes,
    isDefault
  }));

});

assetCmdHandler.register(APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_STATUS, (cmd, ctx) => {

  const { _id, status } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NftItemMetadataDraftStatusUpdatedEvent({ _id, status }));
});

assetCmdHandler.register(APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_MODERATION_MSG, (cmd, ctx) => {

  const { _id, moderationMessage } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NftItemMetadataDraftModerationMsgUpdatedEvent({ _id, moderationMessage }));
});

assetCmdHandler.register(APP_CMD.UPDATE_NFT_COLLECTION_METADATA, (cmd, ctx) => {
  const {
    _id,
    attributes
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NftCollectionMetadataUpdatedEvent({
    _id,
    attributes
  }));

});

assetCmdHandler.register(APP_CMD.CREATE_NFT_ITEM_METADATA_DRAFT, (cmd, ctx) => {
  const data = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new NftItemMetadataDraftCreatedEvent({ ...data, uploadedFiles: ctx.req.files }));
});

assetCmdHandler.register(APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT, (cmd, ctx) => {

  const data = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NftItemMetadataDraftUpdatedEvent({ ...data, uploadedFiles: ctx.req.files }));
});

assetCmdHandler.register(APP_CMD.DELETE_NFT_ITEM_METADATA_DRAFT, (cmd, ctx) => {

  const { _id } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NftItemMetadataDraftDeletedEvent({ _id }));
});

assetCmdHandler.register(APP_CMD.CREATE_NFT_ITEM_METADATA, (cmd, ctx) => {
  const projectContent = cmd.getCmdPayload();

  ctx.state.appEvents.push(new NftItemMetadataCreatedEvent({
    ...projectContent,
    creator: ctx.state.user.username
  }));
});

assetCmdHandler.register(APP_CMD.UPDATE_PROJECT_CONTENT_STATUS, (cmd, ctx) => {

  const { status, _id } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectContentStatusUpdatedEvent({ status, _id }));
});

assetCmdHandler.register(APP_CMD.UPDATE_PROJECT_CONTENT_METADATA, (cmd, ctx) => {

  const { metadata, _id } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectContentMetadataUpdatedEvent({ metadata, _id }));
});

assetCmdHandler.register(APP_CMD.TRANSFER_FT, (cmd, ctx) => {

  const transferData = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new FungibleTokenTransferedEvent(transferData));
});

assetCmdHandler.register(APP_CMD.TRANSFER_NFT, (cmd, ctx) => {

  const transferData = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new NonFungibleTokenTransferedEvent(transferData));
});

assetCmdHandler.register(APP_CMD.CREATE_FT, (cmd, ctx) => {

  const asset = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new FungibleTokenCreatedEvent(asset));
});

assetCmdHandler.register(APP_CMD.CREATE_NFT_COLLECTION, (cmd, ctx) => {

  const asset = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new NftCollectionCreatedEvent(asset));
});

assetCmdHandler.register(APP_CMD.ISSUE_FT, (cmd, ctx) => {

  const asset = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new FungibleTokenIssuedEvent(asset));
});

assetCmdHandler.register(APP_CMD.CREATE_NFT_ITEM, (cmd, ctx) => {

  const asset = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new NftItemIssuedEvent(asset));
});

module.exports = assetCmdHandler;