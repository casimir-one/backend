import { APP_CMD_INFO } from '@deip/command-models';


class ActionCommand {

  constructor(nextHandler, isMultipartForm) {

    function setCommands(ctx) {
      const cmd = isMultipartForm ? ctx.state.form.appCmd : ctx.body.appCmd;

      if (!cmd) {
        ctx.status = 400;
        throw new Error("Server accepts application commands only");
      }

      const appCmd = typeof cmd === 'string' ? JSON.parse(cmd) : cmd;
      const { CMD_NUM } = appCmd;
      const CmdClass = APP_CMD_INFO[CMD_NUM].class;
      ctx.state.appCmd = CmdClass.Deserialize(appCmd);
    }

    if (nextHandler.length === 2) {

      return async (ctx, next) => {
        setCommands(ctx);
        return nextHandler(ctx, next);
      }

    } else {

      return async (ctx) => {
        setCommands(ctx);
        return nextHandler(ctx);
      }

    }
  }

}


class Action {
  constructor(actionHandler) {
    return async (ctx, next) => {
      await actionHandler(ctx);
      await next();
    }
  }
}


class BaseController {

  constructor() {}

  command({ form: ActionFormHandler, h: actionHandler }) {
    if (!ActionFormHandler)
      return new ActionCommand(new Action(actionHandler), false);
      
    return new ActionFormHandler(new ActionCommand(new Action(actionHandler), true));
  }

  query({ h: actionHandler }) {
    return new Action(actionHandler);
  }

}


module.exports = BaseController;