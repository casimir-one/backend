function appEvents(options) {
  return async function (ctx, next) {
    let chain = new Promise((start) => { start() });

    for (let i = 0; i < ctx.state.appEvents.length; i++) {
      let appEvent = ctx.state.appEvents[i];

      console.log(appEvent);

      chain = chain.then(() => {
        return new Promise((success, failure) => {
          success();
        });
      });
    }

    chain = chain.then(() => { console.info("App events pipe passed") });
    chain = chain.catch((err) => { console.error("App events pipe failed", err) });
    await chain;
    await next();
  };
}


module.exports = appEvents;