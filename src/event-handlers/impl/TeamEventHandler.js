import BaseEventHandler from './../base/BaseEventHandler';
import { APP_EVENT } from './../../constants';


class TeamEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const teamEventHandler = new TeamEventHandler();


teamEventHandler.register(APP_EVENT.TEAM_CREATED, async (event, ctx) => {
  // TODO: handle teamReadModel
  console.log(event);
});


module.exports = teamEventHandler;