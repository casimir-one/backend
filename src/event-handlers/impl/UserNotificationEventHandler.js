import BaseEventHandler from './../base/BaseEventHandler';
import { USER_NOTIFICATION_TYPE, RESEARCH_ATTRIBUTE } from './../../constants';
import APP_EVENT from './../../events/base/AppEvent';
import TeamDtoService from './../../services/legacy/researchGroup'; // TODO: separate read/write schema
import UserDtoService from './../../services/legacy/users';
import ProjectDtoService from './../../services/impl/read/ProjectDtoService';
import UserNotificationsDtoService from './../../services/legacy/userNotification';


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


userNotificationEventHandler.register(APP_EVENT.PROJECT_CREATED, async (event, ctx) => {
  const {
    projectId,
    teamId,
    attributes
  } = event.getEventPayload();

  const project = await projectDtoService.getResearch(projectId); // TODO: replace with a call to project read schema
  const team = await teamDtoService.getResearchGroup(teamId);
  const notifiableUsers = await userDtoService.getUsers(ctx.state.tenant.admins);
  const currentUser = await userDtoService.getUser(ctx.state.user.username);

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
        emitter: currentUser
      }
    });
  }

  await userNotificationsDtoService.createUserNotifications(notifications);

});


userNotificationEventHandler.register(APP_EVENT.PROJECT_PROPOSAL_CREATED, async (event, ctx) => {
  const { teamId, attributes } = event.getEventPayload();

  const team = await teamDtoService.getResearchGroup(teamId);
  const currentUser = await userDtoService.getUser(ctx.state.user.username);
  const notifiableUsers = await userDtoService.getUsers(ctx.state.tenant.admins);

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
        emitter: currentUser
      }
    });
  }

  await userNotificationsDtoService.createUserNotifications(notifications);
});


userNotificationEventHandler.register(APP_EVENT.PROJECT_PROPOSAL_ACCEPTED, async (event, ctx) => {
  const { projectId, teamId } = event.getEventPayload();

  const project = await projectDtoService.getResearch(projectId); // TODO: replace with a call to project read schema
  const team = await teamDtoService.getResearchGroup(teamId);
  const notifiableUsers = await userDtoService.getUsers(ctx.state.tenant.admins);
  const currentUser = await userDtoService.getUser(ctx.state.user.username);

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
        emitter: currentUser
      }
    });
  }

  await userNotificationsDtoService.createUserNotifications(notifications);
});


userNotificationEventHandler.register(APP_EVENT.PROJECT_UPDATED, async (event, ctx) => {
  const {
    projectId,
    teamId
  } = event.getEventPayload();

  const project = await projectDtoService.getResearch(projectId);
  const team = await teamDtoService.getResearchGroup(teamId);
  const currentUser = await userDtoService.getUser(ctx.state.user.username);

  const notifiableUsers = await userDtoService.getUsers([...ctx.state.tenant.admins, ...project.members].reduce((acc, name) => !acc.includes(name) ? [name, ...acc] : acc, []));

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
        emitter: currentUser
      }
    });
  }

  await userNotificationsDtoService.createUserNotifications(notifications);
});


userNotificationEventHandler.register(APP_EVENT.PROJECT_UPDATE_PROPOSAL_CREATED, async (event, ctx) => {
  const { teamId, projectId } = event.getEventPayload();

  const team = await teamDtoService.getResearchGroup(teamId);
  const project = await projectDtoService.getResearch(projectId);
  const currentUser = await userDtoService.getUser(ctx.state.user.username);
  const notifiableUsers = await userDtoService.getUsers(ctx.state.tenant.admins);

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
        emitter: currentUser
      }
    });
  }

  await userNotificationsDtoService.createUserNotifications(notifications);
});


userNotificationEventHandler.register(APP_EVENT.PROJECT_INVITE_CREATED, async (event, ctx) => {
  const { 
    invitee,
    teamId
  } = event.getEventPayload();

  const team = await teamDtoService.getResearchGroup(teamId);
  const currentUser = await userDtoService.getUser(ctx.state.user.username);
  const inviteeUser = await userDtoService.getUser(invitee);
  const notifiableUsers = await userDtoService.getUsersByResearchGroup(teamId);

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


userNotificationEventHandler.register(APP_EVENT.PROJECT_INVITE_ACCEPTED, async (event, ctx) => {
  const {
    teamId,
    invitee,
  } = event.getEventPayload();

  const team = await teamDtoService.getResearchGroup(teamId);
  const notifiableUsers = await userDtoService.getUsersByResearchGroup(teamId);
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


userNotificationEventHandler.register(APP_EVENT.PROJECT_INVITE_DECLINED, async (event, ctx) => {
  const {
    invitee,
    teamId
  } = event.getEventPayload();

  const team = await teamDtoService.getResearchGroup(teamId);
  const notifiableUsers = await userDtoService.getUsersByResearchGroup(teamId);
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



module.exports = userNotificationEventHandler;