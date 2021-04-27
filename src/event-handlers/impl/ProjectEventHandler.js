import BaseEventHandler from './../base/BaseEventHandler';
import { APP_EVENT } from './../../constants';


class ProjectEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const projectEventHandler = new ProjectEventHandler();


projectEventHandler.register(APP_EVENT.PROJECT_CREATED, async (event, ctx) => {
  // TODO: handle projectReadModel
  console.log(event);
});

projectEventHandler.register(APP_EVENT.PROJECT_MEMBER_JOINED, async (event, ctx) => {
  // TODO: handle projectReadModel
  console.log(event);
});


module.exports = projectEventHandler;