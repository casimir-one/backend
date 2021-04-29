import BaseEventHandler from './../../event-handlers/base/BaseEventHandler';

function appEvents(options) {
  return async function (ctx, next) {
    await BaseEventHandler.Broadcast(ctx.state.appEvents, ctx);
    await next();
  };
}


module.exports = appEvents;