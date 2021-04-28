import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';


class TeamEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const teamEventHandler = new TeamEventHandler();


teamEventHandler.register(APP_EVENT.TEAM_CREATED, async (event, ctx) => {
  // TODO: handle team read schema
});


module.exports = teamEventHandler;