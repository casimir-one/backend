function requestTimer(options) {
  return async function (ctx, next) {
    let start = new Date;
    await next();
    let ms = new Date - start;
    console.log('%s %s - %s', ctx.method, ctx.url, ms);
  }
}

module.exports = requestTimer;