import BaseCmdHandler from './base/BaseCmdHandler'
import { APP_CMD } from '@deip/command-models';
import deipRpc from '@deip/rpc-client';
import config from './../config';
import * as blockchainService from './../utils/blockchain';


class ProtocolTxCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const protocolTxCmdHandler = new ProtocolTxCmdHandler();


protocolTxCmdHandler.register(APP_CMD.SEND_PROTOCOL_TX, async (cmd, ctx) => {
  const tx = deipRpc.auth.signTransaction(cmd.getTx().finalize(), {}, { tenant: config.TENANT, tenantPrivKey: config.TENANT_PRIV_KEY });
  const txInfo = await blockchainService.sendTransactionAsync(tx);
  return txInfo;
})


export default protocolTxCmdHandler;