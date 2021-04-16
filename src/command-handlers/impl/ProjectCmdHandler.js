import { APP_CMD } from '@deip/command-models';
import BaseCmdHandler from './../base/BaseCmdHandler'
import { ProjectCreatedEvent } from './../../events';


class ProjectCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const projectCmdHandler = new ProjectCmdHandler();


projectCmdHandler.register(APP_CMD.CREATE_PROJECT, async (cmd, ctx) => {
  // TODO: create project model here
  
  ctx.state.appEvents.push(new ProjectCreatedEvent(cmd.getCmdPayload()));
  return cmd.getProtocolEntityId();
});


module.exports = projectCmdHandler;