import appEventHandler from './../event-handlers'

function events(options) {
  return async function (ctx, next) {
    for (let i = 0; i < ctx.state.events.length; i++) {
      let [event, source] = ctx.state.events[i];
      appEventHandler.emit(event, source);
    }
    await next();
  };
}

module.exports = events;