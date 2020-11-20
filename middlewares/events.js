import appEventHandler from './../event-handlers'

function events(options) {
  return async function (ctx, next) {
    let chain = new Promise((start) => { start()});
    for (let i = 0; i < ctx.state.events.length; i++) {
      let appEvent = ctx.state.events[i];
      
      if (Array.isArray(appEvent)) { // legacy
        let [eventName, source] = appEvent;
        chain = chain.then(() => {
          return new Promise((success, failure) => {
            appEventHandler.emit(eventName, { ...source, tenant: ctx.state.tenant }, { success, failure });
          });
        });
      } else {
        let eventName = appEvent.getAppEventName();
        chain = chain.then(() => {
          return new Promise((success, failure) => {
            appEventHandler.emit(eventName, { event: appEvent, tenant: ctx.state.tenant }, { success, failure });
          });
        });
      }
    }
    chain = chain.then(() => { console.info("Events pipe passed") });
    chain = chain.catch((err) => { console.error("Events pipe failed", err) });
    await chain;
    await next();
  };
}

module.exports = events;