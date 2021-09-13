import { JsonDataMsg, MultFormDataMsg } from '@deip/message-models';
import { GrapheneTx, SubstrateTx } from '@deip/chain-service';
import { PROTOCOL_CHAIN } from '@deip/constants';
import config from '../../config';


const TxClassMap = {
  [PROTOCOL_CHAIN.GRAPHENE]: GrapheneTx,
  [PROTOCOL_CHAIN.SUBSTRATE]: SubstrateTx
}


class MessageHandler {

  constructor(nextHandler, isMultipartForm) {

    const TxClass = TxClassMap[config.PROTOCOL];

    function setMessage(ctx) {
      if ((isMultipartForm && !ctx.state.form.envelope) && !ctx.request.body.envelope) {
        ctx.status = 400;
        throw new Error("Server accepts messages with app commands only");
      }

      ctx.state.msg = isMultipartForm
        ? MultFormDataMsg.UnwrapEnvelope(ctx.state.form.envelope, TxClass)
        : JsonDataMsg.UnwrapEnvelope(ctx.request.body.envelope, TxClass);
    }

    if (nextHandler.length === 2) {

      return async (ctx, next) => {
        setMessage(ctx);
        return nextHandler(ctx, next);
      }

    } else {

      return async (ctx) => {
        setMessage(ctx);
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

  constructor() {}

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