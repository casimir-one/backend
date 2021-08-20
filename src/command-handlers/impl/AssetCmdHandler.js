import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { AssetTransferedEvent, AssetCreatedEvent, AssetIssuedEvent } from './../../events';

class AssetCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const assetCmdHandler = new AssetCmdHandler();

assetCmdHandler.register(APP_CMD.ASSET_TRANSFER, (cmd, ctx) => {

  const transferData = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new AssetTransferedEvent(transferData));
});

assetCmdHandler.register(APP_CMD.CREATE_ASSET, (cmd, ctx) => {

  const asset = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new AssetCreatedEvent(asset));
});

assetCmdHandler.register(APP_CMD.ISSUE_ASSET, (cmd, ctx) => {

  const asset = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new AssetIssuedEvent(asset));
});

module.exports = assetCmdHandler;