import { JsonDataMsg, MultFormDataMsg } from '@deip/message-models';


class MessageHandler {

  constructor(nextHandler, isMultipartForm) {

    function setMessage(ctx) {
      if ((isMultipartForm && !ctx.state.form.envelope) && !ctx.request.body.envelope) {
        ctx.status = 400;
        throw new Error("Server accepts messages with app commands only");
      }

      ctx.state.msg = isMultipartForm
        ? MultFormDataMsg.UnwrapEnvelope(ctx.state.form.envelope)
        : JsonDataMsg.UnwrapEnvelope(ctx.request.body.envelope);
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