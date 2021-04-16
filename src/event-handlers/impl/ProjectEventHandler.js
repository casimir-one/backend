import BaseEventHandler from './../base/BaseEventHandler';
import { EVENT } from './../../constants';


class ProjectEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const projectEventHandler = new ProjectEventHandler();


projectEventHandler.register(EVENT.PROJECT_CREATED, async (event, ctx) => {
  // TODO: handle project read schema 
  console.log(event);
});



module.exports = projectEventHandler;