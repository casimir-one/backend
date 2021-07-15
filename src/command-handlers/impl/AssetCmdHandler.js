import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { AssetTransferedEvent } from './../../events';

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

module.exports = assetCmdHandler;