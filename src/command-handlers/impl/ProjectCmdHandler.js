import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { ProjectCreatedEvent, ProjectUpdatedEvent, ProjectDeletedEvent } from './../../events';
import { PROJECT_STATUS } from './../../constants';


class ProjectCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const projectCmdHandler = new ProjectCmdHandler();


projectCmdHandler.register(APP_CMD.CREATE_PROJECT, (cmd, ctx) => {
  const { 
    entityId: projectId, 
    teamId, 
    attributes,
    isDefault
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectCreatedEvent({
    projectId: projectId,
    teamId: teamId,
    attributes: attributes,
    status: PROJECT_STATUS.APPROVED,
    isDefault: isDefault,
    proposalCtx: ctx.state.proposalsStackFrame
  }));

});


projectCmdHandler.register(APP_CMD.UPDATE_PROJECT, (cmd, ctx) => {
  const {
    entityId: projectId, 
    teamId,
    attributes,
    status,
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectUpdatedEvent({
    projectId: projectId,
    teamId: teamId,
    attributes: attributes,
    status: status,
    proposalCtx: ctx.state.proposalsStackFrame
  }));

});


projectCmdHandler.register(APP_CMD.DELETE_PROJECT, (cmd, ctx) => {
  const {
    entityId: projectId,
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectDeletedEvent({
    projectId: projectId
  }));

});


module.exports = projectCmdHandler;