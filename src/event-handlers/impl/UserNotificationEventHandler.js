import BaseEventHandler from './../base/BaseEventHandler';
import config from './../../config';
import { PROJECT_ATTRIBUTE } from './../../constants';
import { USER_NOTIFICATION_STATUS, USER_NOTIFICATION_TYPE } from '@deip/constants';
import APP_EVENT from './../../events/base/AppEvent';
import {
  TeamDtoService,
  UserDtoService,
  ProjectDtoService,
  ReviewDtoService,
  ProjectContentDtoService,
  PortalDtoService,
  UserNotificationService
} from './../../services';
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
const userNotificationService = new UserNotificationService();
const portalDtoService = new PortalDtoService();
const projectContentDtoService = new ProjectContentDtoService();
const reviewDtoService = new ReviewDtoService();

userNotificationEventHandler.register(APP_EVENT.NOTIFICATIONS_MARKED_AS_READ, async (event) => {
  const {
    username,
    markAll,
    notifications
  } = event.getEventPayload();

  await userNotificationService.updateUserNotifications(
    username,
    markAll ? [] : notifications,
    { status: USER_NOTIFICATION_STATUS.READ }
  );
});

userNotificationEventHandler.register(APP_EVENT.PROJECT_CREATED, async (event) => {
  const {
    projectId,
    teamId,
    attributes
  } = event.getEventPayload();

  const portal = await portalDtoService.getPortal(config.TENANT);
  const project = await projectDtoService.getProject(projectId); // TODO: replace with a call to project read schema
  const team = await teamDtoService.getTeam(teamId);
  const notifiableUsers = await userDtoService.getUsers(portal.admins);
  const teamCreator = await userDtoService.getUser(team.creator);

  // TODO: replace with a call to project read schema
  const title = attributes.some(rAttr => rAttr.attributeId.toString() == PROJECT_ATTRIBUTE.TITLE.toString())
    ? attributes.find(rAttr => rAttr.attributeId.toString() == PROJECT_ATTRIBUTE.TITLE.toString()).value
    : "Not Specified";
    
  const notifications = [];
  for (let i = 0; i < notifiableUsers.length; i++) {
    let user = notifiableUsers[i];
    notifications.push({
      username: user.username,
      status: USER_NOTIFICATION_STATUS.UNREAD,
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        isProposalAutoAccepted: true, // legacy
        proposal: { action: 14, data: { title }, is_completed: true }, // legacy
        team,
        project,
        emitter: teamCreator
      }
    });
  }

  await userNotificationService.createUserNotifications(notifications);

});


userNotificationEventHandler.register(APP_EVENT.PROJECT_PROPOSAL_CREATED, async (event) => {
  const { teamId, attributes } = event.getEventPayload();

  const portal = await portalDtoService.getPortal(config.TENANT);
  const team = await teamDtoService.getTeam(teamId);
  const notifiableUsers = await userDtoService.getUsers(portal.admins);
  const teamCreator = await userDtoService.getUser(team.creator);

  // TODO: replace with a call to project read schema
  const title = attributes.some(rAttr => rAttr.attributeId.toString() == PROJECT_ATTRIBUTE.TITLE.toString())
    ? attributes.find(rAttr => rAttr.attributeId.toString() == PROJECT_ATTRIBUTE.TITLE.toString()).value
    : "Not Specified";

  const notifications = [];
  for (let i = 0; i < notifiableUsers.length; i++) {
    let user = notifiableUsers[i];
    notifications.push({
      username: user.username,
      status: USER_NOTIFICATION_STATUS.UNREAD,
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: 14, data: { title } }, // legacy
        team,
        project: null, // legacy
        emitter: teamCreator
      }
    });
  }

  await userNotificationService.createUserNotifications(notifications);
});


userNotificationEventHandler.register(APP_EVENT.PROJECT_PROPOSAL_ACCEPTED, async (event) => {
  const { projectId, teamId } = event.getEventPayload();

  const portal = await portalDtoService.getPortal(config.TENANT);
  const project = await projectDtoService.getProject(projectId);
  const team = await teamDtoService.getTeam(teamId);
  const notifiableUsers = await userDtoService.getUsers(portal.admins);
  const teamCreator = await userDtoService.getUser(team.creator);

  const notifications = [];
  for (let i = 0; i < notifiableUsers.length; i++) {
    let user = notifiableUsers[i];
    notifications.push({
      username: user.username,
      status: USER_NOTIFICATION_STATUS.UNREAD,
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        isProposalAutoAccepted: true, // legacy
        proposal: { action: 14, data: { title: project.title }, is_completed: true }, // legacy
        team,
        project,
        emitter: teamCreator
      }
    });
  }

  await userNotificationService.createUserNotifications(notifications);
});


userNotificationEventHandler.register(APP_EVENT.PROJECT_UPDATED, async (event) => {
  const {
    projectId,
    teamId
  } = event.getEventPayload();

  const portal = await portalDtoService.getPortal(config.TENANT);
  const project = await projectDtoService.getProject(projectId);
  const team = await teamDtoService.getTeam(teamId);
  const teamCreator = await userDtoService.getUser(team.creator);

  const notifiableUsers = await userDtoService.getUsers([...portal.admins, ...project.members].reduce((acc, name) => !acc.includes(name) ? [name, ...acc] : acc, []));

  const notifications = [];
  for (let i = 0; i < notifiableUsers.length; i++) {
    const user = notifiableUsers[i];
    notifications.push({
      username: user.username,
      status: USER_NOTIFICATION_STATUS.UNREAD,
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        isProposalAutoAccepted: true, // legacy
        proposal: { action: 15, is_completed: true }, // legacy
        team,
        project,
        emitter: teamCreator
      }
    });
  }

  await userNotificationService.createUserNotifications(notifications);
});


userNotificationEventHandler.register(APP_EVENT.PROJECT_UPDATE_PROPOSAL_CREATED, async (event) => {
  const { teamId, projectId } = event.getEventPayload();

  const portal = await portalDtoService.getPortal(config.TENANT);
  const team = await teamDtoService.getTeam(teamId);
  const project = await projectDtoService.getProject(projectId);
  const notifiableUsers = await userDtoService.getUsers(portal.admins);
  const teamCreator = await userDtoService.getUser(team.creator);

  const notifications = [];
  for (let i = 0; i < notifiableUsers.length; i++) {
    let user = notifiableUsers[i];
    notifications.push({
      username: user.username,
      status: USER_NOTIFICATION_STATUS.UNREAD,
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: 15, is_completed: false }, // legacy
        team,
        project,
        emitter: teamCreator
      }
    });
  }

  await userNotificationService.createUserNotifications(notifications);
});


userNotificationEventHandler.register(APP_EVENT.TEAM_INVITE_CREATED, async (event) => {
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
      status: USER_NOTIFICATION_STATUS.UNREAD,
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        proposal: { action: 12, is_completed: true }, // legacy
        team,
        invitee: inviteeUser,
        emitter: currentUser
      }
    });
  }

  notifications.push({
    username: invitee,
    status: USER_NOTIFICATION_STATUS.UNREAD,
    type: USER_NOTIFICATION_TYPE.INVITATION,
    metadata: {
      team,
      invitee: inviteeUser
    }
  });

  await userNotificationService.createUserNotifications(notifications);

});


userNotificationEventHandler.register(APP_EVENT.TEAM_INVITE_ACCEPTED, async (event) => {
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
        status: USER_NOTIFICATION_STATUS.UNREAD,
        type: USER_NOTIFICATION_TYPE.INVITATION_APPROVED,
        metadata: {
          team,
          invitee: inviteeUser
        }
      });
    }
  }

  await userNotificationService.createUserNotifications(notifications);

});


userNotificationEventHandler.register(APP_EVENT.TEAM_INVITE_DECLINED, async (event) => {
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
      status: USER_NOTIFICATION_STATUS.UNREAD,
      type: USER_NOTIFICATION_TYPE.INVITATION_REJECTED,
      metadata: {
        team,
        invitee: inviteeUser
      }
    });
  }

  await userNotificationService.createUserNotifications(notifications);

});

userNotificationEventHandler.register(APP_EVENT.PROJECT_TOKEN_SALE_PROPOSAL_CREATED, async (event) => {
  const { projectId, teamId, creator } = event.getEventPayload();

  const project = await projectDtoService.getProject(projectId);
  const team = await teamDtoService.getTeam(teamId);
  const emitterUser = await userDtoService.getUser(creator);

  const { members } = team;

  const notifications = [];
  for (let i = 0; i < members.length; i++) {
    let member = members[i];
    notifications.push({
      username: member,
      status: USER_NOTIFICATION_STATUS.UNREAD,
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: 19, data: { project_id: project.id } }, // legacy
        team,
        project,
        tokenSale: null,
        emitter: emitterUser
      }
    });
  }
  
  await userNotificationService.createUserNotifications(notifications);
});

userNotificationEventHandler.register(APP_EVENT.INVESTMENT_OPPORTUNITY_CREATED, async (event) => {
  const { entityId, projectId, teamId, creator } = event.getEventPayload();

  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc();

  const project = await projectDtoService.getProject(projectId);
  const team = await teamDtoService.getTeam(teamId);
  const emitterUser = await userDtoService.getUser(creator);
  const tokenSale = await chainRpc.getInvestmentOpportunityAsync(entityId);
  const { members } = team;

  const notifications = [];
  for (let i = 0; i < members.length; i++) {
    let member = members[i];
    notifications.push({
      username: member,
      status: USER_NOTIFICATION_STATUS.UNREAD,
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        proposal: { action: 19, data: { project_id: project.id }, is_completed: true }, // legacy
        team,
        project,
        tokenSale,
        emitter: emitterUser
      }
    });
  }

  await userNotificationService.createUserNotifications(notifications);
});

userNotificationEventHandler.register(APP_EVENT.PROJECT_CONTENT_CREATED, async (event) => {
  const { projectId, teamId, creator, entityId: contentId } = event.getEventPayload();

  const project = await projectDtoService.getProject(projectId);
  const team = await teamDtoService.getTeam(teamId);
  const emitterUser = await userDtoService.getUser(creator);
  const projectContent = await projectContentDtoService.getProjectContent(contentId)
  const { members } = team;

  const notifications = [];
  for (let i = 0; i < members.length; i++) {
    let member = members[i];
    notifications.push({
      username: member,
      status: USER_NOTIFICATION_STATUS.UNREAD,
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        proposal: { action: 16, data: { project_id: project.id }, is_completed: true }, // legacy
        team,
        project,
        projectContent,
        emitter: emitterUser
      }
    });
  }

  await userNotificationService.createUserNotifications(notifications);
});

userNotificationEventHandler.register(APP_EVENT.REVIEW_REQUEST_CREATED, async (event) => {
  const { expert: expertId, requestor: requestorId, projectContentId } = event.getEventPayload();

  const requestor = await userDtoService.getUser(requestorId);
  const expert = await userDtoService.getUser(expertId);
  const projectContent = await projectContentDtoService.getProjectContent(projectContentId);
  
  const project = await projectDtoService.getProject(projectContent.projectId);
  const team = await teamDtoService.getTeam(project.teamId);

  await userNotificationService.createUserNotifications([{
    username: expert.account.name,
    status: USER_NOTIFICATION_STATUS.UNREAD,
    type: USER_NOTIFICATION_TYPE.PROJECT_CONTENT_EXPERT_REVIEW_REQUEST,
    metadata: {
      requestor,
      expert,
      team,
      project,
      projectContent
    }
  }]);
});

userNotificationEventHandler.register(APP_EVENT.REVIEW_CREATED, async (event) => {
  const {
    entityId: reviewId,
    author,
    projectContentId
  } = event.getEventPayload();

  let reviewer = await userDtoService.getUser(author);
  let projectContent = await projectContentDtoService.getProjectContent(projectContentId);

  let project = await projectDtoService.getProject(projectContent.projectId);
  let review = await reviewDtoService.getReview(reviewId);

  let team = await teamDtoService.getTeam(project.teamId);
  const { members } = team;

  const notifications = [];
  for (let i = 0; i < members.length; i++) {
    let member = members[i];
    notifications.push({
      username: member,
      status: USER_NOTIFICATION_STATUS.UNREAD,
      type: USER_NOTIFICATION_TYPE.PROJECT_CONTENT_EXPERT_REVIEW,
      metadata: {
        review,
        projectContent,
        project,
        team,
        reviewer
      }
    });
  }

  await userNotificationService.createUserNotifications(notifications);
});

userNotificationEventHandler.register(APP_EVENT.PROJECT_NDA_PROPOSAL_CREATED, async (event) => {
  const {
    creator,
    projectId
  } = event.getEventPayload();

  const project = await projectDtoService.getProject(projectId);
  const emitter = await userDtoService.getUser(creator);
  const portal = await portalDtoService.getPortal(emitter.portalId);

  const notifications = [];
  for (let i = 0; i < project.members.length; i++) {
    let member = project.members[i];
    notifications.push({
      username: member,
      status: USER_NOTIFICATION_STATUS.UNREAD,
      type: USER_NOTIFICATION_TYPE.PROJECT_NDA_PROPOSED,
      metadata: {
        project,
        emitter,
        portal
      }
    });
  }

  await userNotificationService.createUserNotifications(notifications);
});

userNotificationEventHandler.register(APP_EVENT.PROJECT_NDA_CREATED, async (event) => {
  const {
    creator: creatorUsername,
    projectId
  } = event.getEventPayload();

  const project = await projectDtoService.getProject(projectId);
  const creator = await userDtoService.getUser(creatorUsername);
  const portal = await portalDtoService.getPortal(creator.portalId);

  const notifications = [];
  for (let i = 0; i < [...project.members, creatorUsername].length; i++) {
    let member = project.members[i] || creatorUsername;
    notifications.push({
      username: member,
      status: USER_NOTIFICATION_STATUS.UNREAD,
      type: USER_NOTIFICATION_TYPE.PROJECT_NDA_SIGNED,
      metadata: {
        project,
        creator,
        portal
      }
    });
  }

  await userNotificationService.createUserNotifications(notifications);
});

userNotificationEventHandler.register(APP_EVENT.PROJECT_NDA_PROPOSAL_DECLINED, async (event) => {
  const {
    creator: creatorUsername,
    projectId
  } = event.getEventPayload();

  const project = await projectDtoService.getProject(projectId);
  const creator = await userDtoService.getUser(creatorUsername);
  const portal = await portalDtoService.getPortal(creator.portalId);

  const notifications = [];
  for (let i = 0; i < [...project.members, creatorUsername].length; i++) {
    let member = project.members[i] || creatorUsername;
    notifications.push({
      username: member,
      status: USER_NOTIFICATION_STATUS.UNREAD,
      type: USER_NOTIFICATION_TYPE.PROJECT_NDA_REJECTED,
      metadata: {
        project,
        creator,
        portal
      }
    });
  }

  await userNotificationService.createUserNotifications(notifications);
});

userNotificationEventHandler.register(APP_EVENT.UPVOTED_REVIEW, async (event) => {
  // add notify
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

userNotificationEventHandler.register(APP_EVENT.ASSET_ISSUED, async (event) => {
  // add notify
});

userNotificationEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_PROPOSAL_ACCEPTED, async (event) => {
  // add notify
});

userNotificationEventHandler.register(APP_EVENT.LEAVE_TEAM_CREATED, async (event) => {
  // add notify
});

userNotificationEventHandler.register(APP_EVENT.LEAVE_TEAM_ACCEPTED, async (event) => {
  // add notify
});

userNotificationEventHandler.register(APP_EVENT.LEAVE_TEAM_DECLINED, async (event) => {
  // add notify
});

module.exports = userNotificationEventHandler;