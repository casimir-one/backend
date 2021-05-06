import { TxEnvelope, CmdEnvelope } from '@deip/command-models';

class ActionMessage {

  constructor(nextHandler, isMultipartForm) {

    function setMessage(ctx) {
      if ((isMultipartForm && !ctx.state.form.envelope) && !ctx.request.body.envelope) {
        ctx.status = 400;
        throw new Error("Server accepts messages with app commands only");
      }

      const envelope = isMultipartForm ? JSON.parse(ctx.state.form.envelope) : ctx.request.body.envelope;
      const EnvelopeClass = envelope.PROTOCOL ? TxEnvelope : CmdEnvelope;
      const msgEnvelope = EnvelopeClass.Deserialize(envelope);
      ctx.state.msg = msgEnvelope.unwrap();
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


class Action {
  constructor(actionHandler) {
    return async (ctx, next) => {
      await actionHandler(ctx);
      await next();
    }
  }
}


class BaseController {

  constructor() {}

  command({ form: ActionFormHandler, h: actionHandler }) {
    if (!ActionFormHandler)
      return new ActionMessage(new Action(actionHandler), false);
      
    return new ActionFormHandler(new ActionMessage(new Action(actionHandler), true));
  }

  query({ h: actionHandler }) {
    return new Action(actionHandler);
  }

}


module.exports = BaseController;