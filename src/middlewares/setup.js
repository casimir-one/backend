function setup(options) {
  return async function (ctx, next) {
    ctx.state.events = [];
    await next();
  };
}

module.exports = setup;