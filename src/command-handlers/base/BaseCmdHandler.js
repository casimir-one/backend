import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import * as protocolService from './../../utils/blockchain';
import config from './../../config';


class BaseCmdHandler extends EventEmitter {

  constructor() {
    super();
  }


  register(cmdNum, handler) {
    this.on(cmdNum, (cmd, ctx, reply) => {
      return BaseCmdHandler.PromisfyCmdHandler(cmd, ctx, reply, handler)
    });
  }


  async process(msg, ctx) {
    const { tx, appCmds } = msg;
    if (tx) {
      const signedTx = deipRpc.auth.signTransaction(tx.finalize(), {}, { tenant: config.TENANT, tenantPrivKey: config.TENANT_PRIV_KEY });
      const txInfo = await protocolService.sendTransactionAsync(signedTx);
    }

    await BaseCmdHandler.HandleChain(appCmds, ctx);
  };


  handle(cmd, ctx) {
    return new Promise((success, failure) => {
      this.emit(cmd.getCmdNum(), cmd, ctx, { success, failure });
    });
  }


  static async PromisfyCmdHandler(cmd, ctx, reply, handler) {
    if (reply) {
      const { success, failure } = reply;
      try {
        const result = await handler(cmd, ctx);
        success(result);
      } catch (err) {
        failure(err);
      }
    } else {
      handler(cmd, ctx);
    }
  }


  static async HandleChain(cmds, ctx) {
    const CMD_HANDLERS = require('./../../command-handlers/index');

    let chain = new Promise((start, stop) => { start() });

    for (let i = 0; i < cmds.length; i++) {
      const cmd = cmds[i];
      const cmdHandler = CMD_HANDLERS[cmd.getCmdNum()];
      if (!cmdHandler) continue;
      chain = chain.then(() => cmdHandler.handle(cmd, ctx));
    }

    chain = chain.then(() => { console.info("App commands pipe passed") });
    chain = chain.catch((err) => { console.error("App commands pipe failed", err) });
    await chain;
  };

}


module.exports = BaseCmdHandler;