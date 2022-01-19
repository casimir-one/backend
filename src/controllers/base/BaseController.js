import { JsonDataMsg, MultFormDataMsg } from '@deip/message-models';
import config from '../../config';
import { ChainService } from '@deip/chain-service';
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

}


module.exports = BaseController;