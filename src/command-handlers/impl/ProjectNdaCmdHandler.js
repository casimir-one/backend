import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { ProjectNdaCreatedEvent } from './../../events';

class ProjectNdaCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const projectNdaCmdHandler = new ProjectNdaCmdHandler();

projectNdaCmdHandler.register(APP_CMD.CREATE_PROJECT_NDA, (cmd, ctx) => {

  const projectNdaData = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectNdaCreatedEvent(projectNdaData));
});

module.exports = projectNdaCmdHandler;