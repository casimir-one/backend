import { BadRequestError } from './../../errors';
import { APP_CMD } from '@casimir.one/platform-core';
import ActionHandler from './ActionHandler'
import MessageHandler from './MessageHandler'


class BaseController {

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