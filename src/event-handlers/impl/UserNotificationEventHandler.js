import BaseEventHandler from './../base/BaseEventHandler';
import config from './../../config';
import { USER_NOTIFICATION_TYPE, RESEARCH_ATTRIBUTE } from './../../constants';
import APP_EVENT from './../../events/base/AppEvent';
import TenantService from './../../services/legacy/tenant';
import { TeamService, TeamDtoService, UserDtoService, ProjectDtoService } from './../../services';
import UserNotificationsDtoService from './../../services/legacy/userNotification';
import deipRpc from '@deip/rpc-client';
import { ChainService } from '@deip/chain-service';


class UserNotificationEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const userNotificationEventHandler = new UserNotificationEventHandler();


const teamDtoService = new TeamDtoService();
const userDtoService = new UserDtoService();
const projectDtoService = new ProjectDtoService();
const userNotificationsDtoService = new UserNotificationsDtoService();
const tenantService = new TenantService();


userNotificationEventHandler.register(APP_EVENT.PROJECT_CREATED, async (event) => {
  const {
    projectId,
    teamId,
    attributes
  } = event.getEventPayload();

  const tenant = await tenantService.getTenant(config.TENANT);
  const project = await projectDtoService.getProject(projectId); // TODO: replace with a call to project read schema
  const team = await teamDtoService.getTeam(teamId);
  const notifiableUsers = await userDtoService.getUsers(tenant.admins);
  const teamCreator = await userDtoService.getUser(team.creator);

  // TODO: replace with a call to project read schema
  const title = attributes.some(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString())
    ? attributes.find(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString()).value
    : "Not Specified";
    
  const notifications = [];
  for (let i = 0; i < notifiableUsers.length; i++) {
    let user = notifiableUsers[i];
    notifications.push({
      username: user.username,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        isProposalAutoAccepted: true, // legacy
        proposal: { action: 14, data: { title }, is_completed: true }, // legacy
        researchGroup: team,
        research: project,
        emitter: teamCreator
      }
    });
  }

  await userNotificationsDtoService.createUserNotifications(notifications);

});


userNotificationEventHandler.register(APP_EVENT.PROJECT_PROPOSAL_CREATED, async (event) => {
  const { teamId, attributes } = event.getEventPayload();

  const tenant = await tenantService.getTenant(config.TENANT);
  const team = await teamDtoService.getTeam(teamId);
  const notifiableUsers = await userDtoService.getUsers(tenant.admins);
  const teamCreator = await userDtoService.getUser(team.creator);

  // TODO: replace with a call to project read schema
  const title = attributes.some(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString())
    ? attributes.find(rAttr => rAttr.attributeId.toString() == RESEARCH_ATTRIBUTE.TITLE.toString()).value
    : "Not Specified";

  const notifications = [];
  for (let i = 0; i < notifiableUsers.length; i++) {
    let user = notifiableUsers[i];
    notifications.push({
      username: user.username,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: 14, data: { title } }, // legacy
        researchGroup: team,
        research: null, // legacy
        emitter: teamCreator
      }
    });
  }

  await userNotificationsDtoService.createUserNotifications(notifications);
});


userNotificationEventHandler.register(APP_EVENT.PROJECT_PROPOSAL_ACCEPTED, async (event) => {
  const { projectId, teamId } = event.getEventPayload();

  const tenant = await tenantService.getTenant(config.TENANT);
  const project = await projectDtoService.getProject(projectId);
  const team = await teamDtoService.getTeam(teamId);
  const notifiableUsers = await userDtoService.getUsers(tenant.admins);
  const teamCreator = await userDtoService.getUser(team.creator);

  const notifications = [];
  for (let i = 0; i < notifiableUsers.length; i++) {
    let user = notifiableUsers[i];
    notifications.push({
      username: user.username,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        isProposalAutoAccepted: true, // legacy
        proposal: { action: 14, data: { title: project.title }, is_completed: true }, // legacy
        researchGroup: team,
        research: project,
        emitter: teamCreator
      }
    });
  }

  await userNotificationsDtoService.createUserNotifications(notifications);
});


userNotificationEventHandler.register(APP_EVENT.PROJECT_UPDATED, async (event) => {
  const {
    projectId,
    teamId
  } = event.getEventPayload();

  const tenant = await tenantService.getTenant(config.TENANT);
  const project = await projectDtoService.getProject(projectId);
  const team = await teamDtoService.getTeam(teamId);
  const teamCreator = await userDtoService.getUser(team.creator);

  const notifiableUsers = await userDtoService.getUsers([...tenant.admins, ...project.members].reduce((acc, name) => !acc.includes(name) ? [name, ...acc] : acc, []));

  const notifications = [];
  for (let i = 0; i < notifiableUsers.length; i++) {
    const user = notifiableUsers[i];
    notifications.push({
      username: user.username,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        isProposalAutoAccepted: true, // legacy
        proposal: { action: 15, is_completed: true }, // legacy
        researchGroup: team,
        research: project,
        emitter: teamCreator
      }
    });
  }

  await userNotificationsDtoService.createUserNotifications(notifications);
});


userNotificationEventHandler.register(APP_EVENT.PROJECT_UPDATE_PROPOSAL_CREATED, async (event) => {
  const { teamId, projectId } = event.getEventPayload();

  const tenant = await tenantService.getTenant(config.TENANT);
  const team = await teamDtoService.getTeam(teamId);
  const project = await projectDtoService.getProject(projectId);
  const notifiableUsers = await userDtoService.getUsers(tenant.admins);
  const teamCreator = await userDtoService.getUser(team.creator);

  const notifications = [];
  for (let i = 0; i < notifiableUsers.length; i++) {
    let user = notifiableUsers[i];
    notifications.push({
      username: user.username,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: 15, is_completed: false }, // legacy
        researchGroup: team,
        research: project,
        emitter: teamCreator
      }
    });
  }

  await userNotificationsDtoService.createUserNotifications(notifications);
});


userNotificationEventHandler.register(APP_EVENT.PROJECT_INVITE_CREATED, async (event) => {
  const { 
    invitee,
    teamId,
    inviter
  } = event.getEventPayload();

  const team = await teamDtoService.getTeam(teamId);
  const currentUser = await userDtoService.getUser(inviter);
  const inviteeUser = await userDtoService.getUser(invitee);
  const notifiableUsers = await userDtoService.getUsersByTeam(teamId);

  const notifications = [];
  for (let i = 0; i < notifiableUsers.length; i++) {
    let user = notifiableUsers[i];
    notifications.push({
      username: user.username,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        proposal: { action: 12, is_completed: true }, // legacy
        researchGroup: team,
        invitee: inviteeUser,
        emitter: currentUser
      }
    });
  }

  notifications.push({
    username: invitee,
    status: 'unread',
    type: USER_NOTIFICATION_TYPE.INVITATION,
    metadata: {
      researchGroup: team,
      invitee: inviteeUser
    }
  });

  await userNotificationsDtoService.createUserNotifications(notifications);

});


userNotificationEventHandler.register(APP_EVENT.PROJECT_INVITE_ACCEPTED, async (event) => {
  const {
    teamId,
    invitee,
  } = event.getEventPayload();

  const team = await teamDtoService.getTeam(teamId);
  const notifiableUsers = await userDtoService.getUsersByTeam(teamId);
  const inviteeUser = await userDtoService.getUser(invitee);

  const notifications = [];
  for (let i = 0; i < notifiableUsers.length; i++) {
    let user = notifiableUsers[i];
    if (user.username != invitee) {
      notifications.push({
        username: user.username,
        status: 'unread',
        type: USER_NOTIFICATION_TYPE.INVITATION_APPROVED,
        metadata: {
          researchGroup: team,
          invitee: inviteeUser
        }
      });
    }
  }

  await userNotificationsDtoService.createUserNotifications(notifications);

});


userNotificationEventHandler.register(APP_EVENT.PROJECT_INVITE_DECLINED, async (event) => {
  const {
    invitee,
    teamId
  } = event.getEventPayload();

  const team = await teamDtoService.getTeam(teamId);
  const notifiableUsers = await userDtoService.getUsersByTeam(teamId);
  const inviteeUser = await userDtoService.getUser(invitee);

  const notifications = [];
  for (let i = 0; i < notifiableUsers.length; i++) {
    let user = notifiableUsers[i];
    notifications.push({
      username: user.username,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.INVITATION_REJECTED,
      metadata: {
        researchGroup: team,
        invitee: inviteeUser
      }
    });
  }

  await userNotificationsDtoService.createUserNotifications(notifications);

});

userNotificationEventHandler.register(APP_EVENT.PROJECT_TOKEN_SALE_PROPOSAL_CREATED, async (event) => {
  const { projectId, teamId, creator } = event.getEventPayload();

  const chainService = await ChainService.getInstanceAsync(config);
  const chainApi = chainService.getChainApi();

  const project = await projectDtoService.getProject(projectId);
  const team = await teamDtoService.getTeam(teamId);
  const emitterUser = await userDtoService.getUser(creator);

  const refs = await chainApi.getTeamMemberReferencesAsync([team.external_id], false);
  const [members] = refs.map((g) => g.map(m => m.account));

  const notifications = [];
  for (let i = 0; i < members.length; i++) {
    let member = members[i];
    notifications.push({
      username: member,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("create_research_token_sale"), data: { research_id: project.id } }, // legacy
        researchGroup: team,
        research: project,
        tokenSale: null,
        emitter: emitterUser
      }
    });
  }
  
  await userNotificationsDtoService.createUserNotifications(notifications);
});

userNotificationEventHandler.register(APP_EVENT.PROJECT_TOKEN_SALE_CREATED, async (event) => {
  const { entityId, projectId, teamId, creator } = event.getEventPayload();

  const chainService = await ChainService.getInstanceAsync(config);
  const chainApi = chainService.getChainApi();

  const project = await projectDtoService.getProject(projectId);
  const team = await teamDtoService.getTeam(teamId);
  const emitterUser = await userDtoService.getUser(creator);
  const tokenSale = await chainApi.getProjectTokenSaleAsync(entityId);
  const refs = await chainApi.getTeamMemberReferencesAsync([team.external_id], false);
  const [members] = refs.map((g) => g.map(m => m.account));

  const notifications = [];
  for (let i = 0; i < members.length; i++) {
    let member = members[i];
    notifications.push({
      username: member,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        proposal: { action: deipRpc.operations.getOperationTag("create_research_token_sale"), data: { research_id: project.id }, is_completed: true }, // legacy
        researchGroup: team,
        research: project,
        tokenSale,
        emitter: emitterUser
      }
    });
  }

  await userNotificationsDtoService.createUserNotifications(notifications);
});

userNotificationEventHandler.register(APP_EVENT.PROJECT_TOKEN_SALE_PROPOSAL_DECLINED, async (event) => {
  // add notify
});

userNotificationEventHandler.register(APP_EVENT.PROJECT_TOKEN_SALE_PROPOSAL_ACCEPTED, async (event) => {
  // add notify
});

userNotificationEventHandler.register(APP_EVENT.ASSET_TRANSFERED, async (event) => {
  // add notify
});

module.exports = userNotificationEventHandler;