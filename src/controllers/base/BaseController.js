import { JsonDataMsg, MultFormDataMsg } from '@casimir.one/messages';
import config from '../../config';
import { ChainService } from '@casimir.one/chain-service';
import { BadRequestError } from './../../errors';
import { APP_CMD } from '@casimir.one/platform-core';


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

  async validateCmds(cmds, validOrders) {
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

        if (i+1 === orderLength) {
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

    const validatedSuccess = await validateFunc(cmds, validOrders);

    if (!validatedSuccess) {
      throw new BadRequestError(`Wrong cmd order`);
    }
  }

  extractEntityId(msg, cmdNum, key='entityId') {
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

}


module.exports = BaseController;