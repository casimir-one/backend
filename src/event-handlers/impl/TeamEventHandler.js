import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { TeamService } from './../../services';


class TeamEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const teamEventHandler = new TeamEventHandler();
const teamService = new TeamService();


teamEventHandler.register(APP_EVENT.TEAM_CREATED, async (event) => {

  const {
    accountId,
    creator,
    description,
    attributes
  } = event.getEventPayload();

  const team = await teamService.createTeam({
    externalId: accountId,
    creator: creator,
    name: description, // TODO: extract from attributes
    description: description,
    attributes: attributes
  });

});

teamEventHandler.register(APP_EVENT.TEAM_UPDATED, async (event) => {

  const {
    accountId,
    creator,
    description,
    attributes
  } = event.getEventPayload();

  const team = await teamService.updateTeam(accountId, {
    attributes: attributes
  });

});


module.exports = teamEventHandler;