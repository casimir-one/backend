import { APP_CMD } from '@deip/command-models';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { ProjectCreatedEvent, ProjectMemberJoinedEvent } from './../../events';
import AttributesService from './../../services/attributes';
import ProjectsService from './../../services/research';
import { ATTRIBUTE_SCOPE, ATTRIBUTE_TYPE, RESEARCH_STATUS } from './../../constants';


class ProjectCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const projectCmdHandler = new ProjectCmdHandler();

const projectsService = new ProjectsService();
const attributesService = new AttributesService();


projectCmdHandler.register(APP_CMD.CREATE_PROJECT, async (cmd, ctx) => {
  const { entityId: projectId, teamId, attributes } = cmd.getCmdPayload();

  const systemAttributes = await attributesService.getSystemAttributes();
  const teamAttr = systemAttributes.find(attr => attr.scope == ATTRIBUTE_SCOPE.RESEARCH && attr.type == ATTRIBUTE_TYPE.RESEARCH_GROUP);
  if (teamAttr.isHidden) {
    const rAttr = attributes.find(rAttr => rAttr.attributeId === teamAttr._id.toString());
    if (rAttr.value === null) {
      rAttr.value = [teamId];
    }
  }

  const projectWriteModel = await projectsService.createResearchRef({
    externalId: projectId,
    researchGroupExternalId: teamId,
    attributes: attributes,
    status: RESEARCH_STATUS.APPROVED
  });


  ctx.state.appEvents.push(new ProjectCreatedEvent({
    projectId: projectWriteModel._id,
    teamId: projectWriteModel.researchGroupExternalId,
    attributes: projectWriteModel.attributes,
    status: projectWriteModel.status
  }));

});


projectCmdHandler.register(APP_CMD.JOIN_PROJECT, async (cmd, ctx) => {  
  ctx.state.appEvents.push(new ProjectMemberJoinedEvent(cmd.getCmdPayload()));
});


module.exports = projectCmdHandler;