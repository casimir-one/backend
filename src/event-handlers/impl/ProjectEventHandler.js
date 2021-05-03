import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import ProjectService from './../../services/impl/write/ProjectService';


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

  const project = await projectService.createProject({
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

  const project = await projectService.updateProject(projectId, {
    attributes: attributes
  });

});

projectEventHandler.register(APP_EVENT.PROJECT_MEMBER_JOINED, async (event) => {
  // TODO: handle project read schema
});


module.exports = projectEventHandler;