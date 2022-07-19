import { APP_CMD } from '@casimir/platform-core';
import { ChainService } from '@deip/chain-service';
import { JsonDataMsg, MultFormDataMsg } from '@deip/messages';
import config from '../../config';
import { OffchainProcessManager } from '../../process-manager/OffchainProcessManager';
import { logDebug } from '../../utils/log';
import { BadRequestError } from './../../errors';


class MessageHandler {

  constructor(nextHandler, isMultipartForm) {

    async function setMessage(ctx) {

      const chainService = await ChainService.getInstanceAsync(config);
      const chainInfo = chainService.getChainInfo();

      const TxClass = chainInfo.TxClass;
      const metadata = chainInfo.metadata;

      if ((isMultipartForm && !ctx.state.form.envelope) && !ctx.request.body.envelope) {
        throw new BadRequestError("Server accepts messages with app commands only");
      }

      ctx.state.msg = isMultipartForm
        ? MultFormDataMsg.UnwrapEnvelope(ctx.state.form.envelope, TxClass, metadata)
        : JsonDataMsg.UnwrapEnvelope(ctx.request.body.envelope, TxClass, metadata);
    }

    if (nextHandler.length === 2) {

      return async (ctx, next) => {
        await setMessage(ctx);
        return nextHandler(ctx, next);
      }

    } else {

      return async (ctx) => {
        await setMessage(ctx);
        return nextHandler(ctx);
      }

    }
  }

}


class ActionHandler {
  constructor(actionHandler) {

    if (actionHandler.length === 2) {

      return async (ctx, next) => {
        await actionHandler(ctx);
        await next();
      }

    } else {

      return async (ctx) => {
        await actionHandler(ctx);
      }

    }

  }
}


class BaseController {

  constructor() { }

  command({ form: FormHandler, h: actionHandler }) {
    if (!FormHandler)
      return new MessageHandler(new ActionHandler(actionHandler), false);

    return new FormHandler(new MessageHandler(new ActionHandler(actionHandler), true));
  }

  query({ h: actionHandler }) {
    return new ActionHandler(actionHandler);
  }

  static async validateCmds(cmds, validOrders) {
    const validateOrder = async (appCmds, validCmdsOrder) => {
      const orderLength = validCmdsOrder.length;

      if (orderLength !== appCmds.length) {
        return false;
      }

      for (let i = 0; i < orderLength; i++) {
        const {
          cmdNum,
          proposalType,
          proposedCmdsOrder: validProposedCmdsOrder,
          validate
        } = validCmdsOrder[i];

        const appCmd = appCmds[i];
        const appCmdNum = appCmd.getCmdNum();

        if (appCmdNum !== cmdNum) {
          return false;
        }

        if (appCmdNum === APP_CMD.CREATE_PROPOSAL) {
          if (proposalType && proposalType !== appCmd.getProposalType()) {
            return false;
          }

          if (validate) {
            await validate(appCmd, appCmds);
          }

          const proposalCmds = appCmd.getProposedCmds();

          if (proposalCmds.length) {
            const success = await validateFunc(proposalCmds, validProposedCmdsOrder);

            if (!success) {
              return false;
            }
          } else {
            throw new BadRequestError(`Proposal must contain commands`);
          }
        }

        if (validate) {
          await validate(appCmd, appCmds);
        }

        if (i + 1 === orderLength) {
          return true;
        }
      }
    }

    const validateFunc = async (appCmds, validCmdsOrders) => {
      if (Array.isArray(validCmdsOrders[0])) {
        for (let orderNum = 0; orderNum < validCmdsOrders.length; orderNum++) {
          const currentOrder = validCmdsOrders[orderNum];
          const validatedSuccess = await validateOrder(appCmds, currentOrder);

          if (validatedSuccess) return true
        }
      } else {
        return await validateOrder(appCmds, validCmdsOrders);
      }
    }

    const validatedSuccess = await validateFunc(ctx, cmds, validOrders);

    if (!validatedSuccess) {
      throw new BadRequestError(`Wrong cmd order`);
    }
  }

  extractEntityId(msg, cmdNum, key = 'entityId') {
    const { appCmds } = msg;
    const appCmd = appCmds.find((cmd) => cmd.getCmdNum() == cmdNum || cmd.getCmdNum() == APP_CMD.CREATE_PROPOSAL);

    if (appCmd && appCmd.getCmdNum() == cmdNum) {
      return appCmd.getCmdPayload()[key];
    } else if (appCmd && appCmd.getCmdNum() == APP_CMD.CREATE_PROPOSAL) {
      const cmd = appCmd.getProposedCmds().find(c => c.getCmdNum() == cmdNum);
      return cmd.getCmdPayload()[key];
    } else {
      return null;
    }
  }

  async sendChainTxAndProcessWorkflow(tx, workflow) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainNodeClient = chainService.getChainNodeClient();
    // const eventStore = await EventStore.getInstanceAsync(config);
    // const eventBus = await EventBus.getInstanceAsync(config);
    const offchainProcessManager = await OffchainProcessManager.getInstanceAsync(config);

    const verifiedTxPromise = tx.isOnBehalfPortal()
      ? tx.verifyByPortalAsync({ verificationPubKey: config.TENANT_PORTAL.pubKey, verificationPrivKey: config.TENANT_PORTAL.privKey }, chainNodeClient)
      : Promise.resolve(tx.getSignedRawTx());
    const verifiedTx = await verifiedTxPromise;

    const lastBlockNumber = await chainRpc.getBlockAsync();
    const txHash = await chainRpc.sendTxAsync(verifiedTx);

    // This needs to be validated for concurrent updates of the same entity
    const workflowId = await offchainProcessManager.queueOffchainWorkflow(txHash, lastBlockNumber, workflow);
    const appEvents = await offchainProcessManager.waitOffchainWorkflow(workflowId);

    logDebug("sendChainTxAndProcessWorkflow finished, appEvents:", appEvents);

    //I'm not sure if this is the best way to do this, because server might fail in the middle of this process and we will have only chainEvents to process
    //mb the better option would be transfer this dispatch to the processManager
    // await eventStore.saveBatch(appEvents);
    // eventBus.dispatch(appEvents);
  }

}


module.exports = BaseController;