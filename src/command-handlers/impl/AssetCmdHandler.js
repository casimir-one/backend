import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import {
  FungibleTokenTransferedEvent,
  NonFungibleTokenTransferedEvent,
  FungibleTokenCreatedEvent,
  NonFungibleTokenCreatedEvent,
  FungibleTokenIssuedEvent,
  NonFungibleTokenIssuedEvent
} from './../../events';

class AssetCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const assetCmdHandler = new AssetCmdHandler();

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

assetCmdHandler.register(APP_CMD.CREATE_NFT, (cmd, ctx) => {

  const asset = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new NonFungibleTokenCreatedEvent(asset));
});

assetCmdHandler.register(APP_CMD.ISSUE_FT, (cmd, ctx) => {

  const asset = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new FungibleTokenIssuedEvent(asset));
});

assetCmdHandler.register(APP_CMD.ISSUE_NFT, (cmd, ctx) => {

  const asset = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new NonFungibleTokenIssuedEvent(asset));
});

module.exports = assetCmdHandler;