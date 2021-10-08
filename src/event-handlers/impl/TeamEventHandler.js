import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { TeamService, AttributeDtoService } from './../../services';
import { ATTR_SCOPES } from '@deip/constants';
import { ATTRIBUTE_TYPE } from './../../constants';


class TeamEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const teamEventHandler = new TeamEventHandler();
const teamService = new TeamService();
const attributeDtoService = new AttributeDtoService();


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
    attributes: attributes,
    members: [creator]
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

teamEventHandler.register(APP_EVENT.USER_CREATED, async (event) => {

  const {
    username
  } = event.getEventPayload();

  const attrs = await attributeDtoService.getAttributesByScope(ATTR_SCOPES.TEAM);
  const attr = attrs.find(
    ({ type, title }) => title === 'Name' && type === ATTRIBUTE_TYPE.TEXT
  );

  const attributes = attr ? [{attributeId: attr._id, value: username}] : [];

  await teamService.createTeam({
    externalId: username,
    creator: username,
    attributes,
    members: [username]
  });

});

teamEventHandler.register(APP_EVENT.TEAM_MEMBER_JOINED, async (event) => {

  const {
    member,
    teamId
  } = event.getEventPayload();

  const team = await teamService.getTeam(teamId);

  const updatedTeam = await teamService.updateTeam(teamId, {
    members: [...team.members, member]
  });
});


teamEventHandler.register(APP_EVENT.TEAM_MEMBER_LEFT, async (event) => {
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