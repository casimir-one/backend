function errorsHandler(options) {
  return async function (ctx, next) {
    try {
      await next();
    } catch (err) {
      if (ctx._matchedRoute == "/auth/sign-up") { // Get rid of after removing legacy events !
        return;
      }
      if (401 === err.status) {
        ctx.status = 401;
        ctx.body = {
          success: false,
          token: null,
          info: 'Protected resource, use "Authorization" header to get access'
        };
      } else {
        throw err;
      }
    }
  }
}


module.exports = errorsHandler;