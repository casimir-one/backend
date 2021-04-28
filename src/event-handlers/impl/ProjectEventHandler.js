import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import ProjectDtoService from './../../services/impl/read/ProjectDtoService';


class ProjectEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const projectEventHandler = new ProjectEventHandler();

const projectDtoService = new ProjectDtoService();

projectEventHandler.register(APP_EVENT.PROJECT_CREATED, async (event, ctx) => {
  // TODO: handle project read schema
});

projectEventHandler.register(APP_EVENT.PROJECT_MEMBER_JOINED, async (event, ctx) => {
  // TODO: handle project read schema
});


module.exports = projectEventHandler;