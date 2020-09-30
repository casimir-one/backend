import appEventHandler from './../event-handlers'

function events(options) {
  return async function (ctx, next) {
    let chain = new Promise((start) => { start()});
    for (let i = 0; i < ctx.state.events.length; i++) {
      let [event, source] = ctx.state.events[i];
      chain = chain.then(() => {
        return new Promise((success, failure) => {
          appEventHandler.emit(event, { ...source, tenant: ctx.state.tenant }, { success, failure });
        });
      })
    }
    chain = chain.then(() => { console.info("Events pipe passed") });
    chain = chain.catch((err) => { console.error("Events pipe failed", err) });
    await chain;
    await next();
  };
}

module.exports = events;