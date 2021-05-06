import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import TeamService from './../../services/legacy/researchGroup';


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

  const team = await teamService.createResearchGroupRef({
    externalId: accountId,
    creator: creator,
    name: description, // TODO: extract from attributes
    description: description,
    attributes: attributes
  });

});


module.exports = teamEventHandler;