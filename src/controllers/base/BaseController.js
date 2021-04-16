import { APP_CMD_INFO } from '@deip/command-models';


class ApplicationCommandExtractor {

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


class BaseController {

  action(actionHandler) {
    return new ApplicationCommandExtractor(actionHandler, false);
  }

  actionForm(FormHandler, actionHandler) {
    return new FormHandler(new ApplicationCommandExtractor(actionHandler, true));
  }

}


module.exports = BaseController;