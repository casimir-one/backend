class BaseForm {

  constructor(formHandler, nextHandler) {

    function setForm(ctx, form) {
      ctx.state.form = { ...ctx.req.body, ...form };
    }

    if (nextHandler.length === 2) {

      return async (ctx, next) => {
        const form = await formHandler(ctx);
        setForm(ctx, form);
        return nextHandler(ctx, next);
      }

    } else {
      
      return async (ctx) => {
        const form = await formHandler(ctx);
        setForm(ctx, form);
        return nextHandler(ctx);
      }

    }
  }
  
}



export default BaseForm;