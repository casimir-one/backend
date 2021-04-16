function setup(options) {
  return async function (ctx, next) {
    ctx.state.events = []; // legacy
    ctx.state.appEvents = [];
    await next();
  };
}

module.exports = setup;