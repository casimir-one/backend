import { APP_CMD } from '@deip/command-models';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { ProjectCreatedEvent, ProjectMemberJoinedEvent, ProjectUpdatedEvent, ProjectDeletedEvent } from './../../events';
import { RESEARCH_STATUS } from './../../constants';


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
    attributes 
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectCreatedEvent({
    projectId: projectId,
    teamId: teamId,
    attributes: attributes,
    status: RESEARCH_STATUS.APPROVED,
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


projectCmdHandler.register(APP_CMD.JOIN_PROJECT, (cmd, ctx) => {
  const { member, teamId, projectId } = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new ProjectMemberJoinedEvent({
    member: member,
    teamId: teamId,
    projectId: projectId,
    proposalCtx: ctx.state.proposalsStackFrame
  }));

});


module.exports = projectCmdHandler;