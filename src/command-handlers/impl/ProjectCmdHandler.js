import BaseCmdHandler from './../base/BaseCmdHandler'
import { APP_CMD } from '@deip/command-models';


class ProjectCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const projectCmdHandler = new ProjectCmdHandler();


projectCmdHandler.register(APP_CMD.CREATE_PROJECT, async (cmd, ctx) => {
  // TODO: create project model
  ctx.state.appEvents.push({ name: "ProjectCreated", payload: cmd.getCmdPayload() });
  return cmd.getProtocolEntityId();
});


module.exports = projectCmdHandler;