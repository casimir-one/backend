class ActionHandler {
  constructor(actionHandler) {
    if (actionHandler.length === 2) {
      return async (ctx, next) => {
        await actionHandler(ctx);
        await next();
      }
    } else {
      return async (ctx) => {
        await actionHandler(ctx);
      }
    }
  }
}

module.exports = ActionHandler;