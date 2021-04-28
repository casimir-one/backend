import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import * as protocolService from './../../utils/blockchain';
import config from './../../config';
import { APP_PROPOSAL } from '@deip/command-models';
import {
  logError,
  logWarn,
  logCmdInfo
} from './../../utils/log';


class BaseCmdHandler extends EventEmitter {

  constructor() {
    super();
  }


  register(cmdNum, handler) {
    this.on(cmdNum, (cmd, ctx, reply) => {
      BaseCmdHandler.PromisfyCmdHandler(cmd, ctx, reply, handler);
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
    })
      .then(() => {
        logCmdInfo(`Command ${cmd.getCmdName()} is handled by ${this.constructor.name} ${ctx.state.proposalsStackFrame ? 'within ' + APP_PROPOSAL[ctx.state.proposalsStackFrame.type] + ' flow (' + ctx.state.proposalsStackFrame.proposalId +')' : ''}`);
      })
      .catch((err) => {
        logError(`Command ${cmd.getCmdName()} ${ctx.state.proposalsStackFrame ? 'within ' + APP_PROPOSAL[ctx.state.proposalsStackFrame.type] + ' flow (' + ctx.state.proposalsStackFrame.proposalId + ')' : ''} failed with an error:`, err);
        throw err;
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

    let chain = new Promise((start) => { start() });

    for (let i = 0; i < cmds.length; i++) {
      const cmd = cmds[i];
      const cmdHandler = CMD_HANDLERS[cmd.getCmdNum()];
      if (!cmdHandler) {
        logWarn(`WARNING: No command handler registered for ${cmd.getCmdName()} command`);
        continue;
      }
      chain = chain.then(() => cmdHandler.handle(cmd, ctx));
    }

    await chain;
  };

}


module.exports = BaseCmdHandler;