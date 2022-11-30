import { BadRequestError } from './../../errors';
import { JsonDataMsg, MultFormDataMsg } from '@casimir.one/messages';
import { ChainService } from '@casimir.one/chain-service';
import config from '../../config';


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

module.exports = MessageHandler;