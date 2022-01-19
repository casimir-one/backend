function errorsHandler(options) {
  return async function (ctx, next) {
    try {
      await next();
    } catch (err) {
      if (ctx._matchedRoute == "/auth/sign-up") { // Get rid of after removing legacy events !
        return;
      }
      console.error(err);
      if (401 === err.status) {
        ctx.errorRes(err, {
          extraInfo: {
            success: false,
            token: null,
            info: 'Protected resource, use "Authorization" header to get access'
          }
        })
      } else {
        ctx.errorRes(err)
      }
    }
  }
}


module.exports = errorsHandler;