import { APP_EVENT } from '@deip/constants';
import { AttributeDtoService, TeamService } from '../../../services';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';

class TeamEventHandler extends PortalAppEventHandler {

  constructor() {
    super();
  }

}

const teamEventHandler = new TeamEventHandler();
const teamService = new TeamService();
const attributeDtoService = new AttributeDtoService();


teamEventHandler.register(APP_EVENT.DAO_CREATED, async (event) => {

  const {
    isTeamAccount,
    daoId,
    creator,
    description,
    attributes
  } = event.getEventPayload();

  if (isTeamAccount) {
    const team = await teamService.createTeam({
      _id: daoId,
      creator: creator,
      name: description, // TODO: extract from attributes
      description: description,
      attributes: attributes,
      members: [creator]
    });
  }

});

teamEventHandler.register(APP_EVENT.DAO_UPDATED, async (event) => {

  const {
    isTeamAccount,
    daoId,
    creator,
    description,
    attributes
  } = event.getEventPayload();

  if (isTeamAccount) {
    const team = await teamService.updateTeam(daoId, {
      attributes: attributes
    });
  }

});

teamEventHandler.register(APP_EVENT.DAO_MEMBER_ADDED, async (event) => {

  const {
    member,
    teamId
  } = event.getEventPayload();

  const team = await teamService.getTeam(teamId);

  const updatedTeam = await teamService.updateTeam(teamId, {
    members: [...team.members, member]
  });
});


teamEventHandler.register(APP_EVENT.DAO_MEMBER_REMOVED, async (event) => {
  const {
    member,
    teamId
  } = event.getEventPayload();

  const team = await teamService.getTeam(teamId);
  const updatedMembers = [...team.members];
  const index = updatedMembers.indexOf(member);
  updatedMembers.splice(index, 1);

  const updatedTeam = await teamService.updateTeam(teamId, {
    members: updatedMembers
  });
});

module.exports = teamEventHandler;