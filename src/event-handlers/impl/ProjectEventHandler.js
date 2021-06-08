import BaseEventHandler from './../base/BaseEventHandler';
import crypto from '@deip/lib-crypto';
import APP_EVENT from './../../events/base/AppEvent';
import { RESEARCH_STATUS } from './../../constants';
import { ProjectService } from './../../services';
import { TextEncoder } from 'util';

class ProjectEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const projectEventHandler = new ProjectEventHandler();

const projectService = new ProjectService();


projectEventHandler.register(APP_EVENT.PROJECT_CREATED, async (event) => {
  const {
    projectId,
    teamId,
    description,
    attributes,
    status
  } = event.getEventPayload();

  await projectService.createProject({
    projectId: projectId,
    teamId: teamId,
    attributes: attributes,
    status: status
  });

});


projectEventHandler.register(APP_EVENT.PROJECT_UPDATED, async (event) => {
  const {
    projectId,
    attributes
  } = event.getEventPayload();

  await projectService.updateProject(projectId, {
    attributes: attributes
  });

});


projectEventHandler.register(APP_EVENT.PROJECT_DELETED, async (event) => {
  const {
    projectId
  } = event.getEventPayload();

  await projectService.updateProject(projectId, { status: RESEARCH_STATUS.DELETED });

});


projectEventHandler.register(APP_EVENT.PROJECT_MEMBER_JOINED, async (event) => {
  // TODO: handle project read schema
});


projectEventHandler.register(APP_EVENT.ATTRIBUTE_UPDATED, async (event) => {
  const { attribute } = event.getEventPayload();
  await projectService.updateAttributeInResearches({
    attributeId: attribute._id,
    type: attribute.type,
    valueOptions: attribute.valueOptions,
    defaultValue: attribute.defaultValue || null
  });
});


projectEventHandler.register(APP_EVENT.ATTRIBUTE_DELETED, async (event) => {
  const { attributeId } = event.getEventPayload();

  await projectService.removeAttributeFromResearches({
    attributeId
  });
});


projectEventHandler.register(APP_EVENT.TEAM_CREATED, async (event) => {
  const { accountId } = event.getEventPayload();
  const projectId = crypto.hexify(crypto.ripemd160(new TextEncoder('utf-8').encode(accountId).buffer));

  await projectService.createProject({
    projectId: projectId,
    teamId: accountId,
    attributes: [],
    status: RESEARCH_STATUS.APPROVED
  });
});


module.exports = projectEventHandler;