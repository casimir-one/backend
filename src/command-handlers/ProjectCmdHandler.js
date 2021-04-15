import BaseCmdHandler from './base/BaseCmdHandler'
import { APP_CMD } from '@deip/command-models';


class ProjectCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const projectCmdHandler = new ProjectCmdHandler();


projectCmdHandler.register(APP_CMD.CREATE_PROJECT, async (cmd, ctx) => {
  console.log(cmd);
  console.log(ctx.state.user.username);
  return cmd.getProtocolEntityId();
})


export default projectCmdHandler;