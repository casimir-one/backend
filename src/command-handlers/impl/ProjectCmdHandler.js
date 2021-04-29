import { APP_CMD } from '@deip/command-models';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { ProjectCreatedEvent, ProjectMemberJoinedEvent, ProjectUpdatedEvent } from './../../events';
import ProjectService from './../../services/impl/write/ProjectService';
import { RESEARCH_STATUS } from './../../constants';


class ProjectCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const projectCmdHandler = new ProjectCmdHandler();

const projectService = new ProjectService();


projectCmdHandler.register(APP_CMD.CREATE_PROJECT, async (cmd, ctx) => {
  const { entityId: projectId, teamId, attributes } = cmd.getCmdPayload();

  const project = await projectService.createProject({
    projectId: projectId,
    teamId: teamId,
    attributes: attributes,
    status: RESEARCH_STATUS.APPROVED
  });

  ctx.state.appEvents.push(new ProjectCreatedEvent({
    projectId: project._id,
    teamId: project.researchGroupExternalId,
    attributes: project.attributes,
    status: project.status,
    proposalCtx: ctx.state.proposalsStackFrame
  }));

});


projectCmdHandler.register(APP_CMD.UPDATE_PROJECT, async (cmd, ctx) => {
  const { entityId: projectId, attributes } = cmd.getCmdPayload();

  const project = await projectService.updateProject(projectId, {
    attributes: attributes
  });

  ctx.state.appEvents.push(new ProjectUpdatedEvent({
    projectId: project._id,
    teamId: project.researchGroupExternalId,
    attributes: project.attributes,
    status: project.status,
    proposalCtx: ctx.state.proposalsStackFrame
  }));

});



projectCmdHandler.register(APP_CMD.JOIN_PROJECT, async (cmd, ctx) => {
  const { member, teamId, projectId } = cmd.getCmdPayload();
  // TODO: add member to write schema
  ctx.state.appEvents.push(new ProjectMemberJoinedEvent({
    member: member,
    teamId: teamId,
    projectId: projectId,
    proposalCtx: ctx.state.proposalsStackFrame
  }));

});


module.exports = projectCmdHandler;