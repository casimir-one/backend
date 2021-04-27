import BaseEventHandler from './../base/BaseEventHandler';
import { APP_EVENT, USER_NOTIFICATION_TYPE } from './../../constants';
import TeamsService from './../../services/researchGroup';
import UsersService from './../../services/users';
import ProjectsService from './../../services/research';
import UserNotificationsService from './../../services/userNotification';


class UserNotificationEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const userNotificationEventHandler = new UserNotificationEventHandler();


const teamsService = new TeamsService();
const usersService = new UsersService();
const projectsService = new ProjectsService();
const userNotificationsService = new UserNotificationsService();


userNotificationEventHandler.register(APP_EVENT.PROJECT_CREATED, async (event, ctx) => {

  const { projectId, teamId } = event.getEventPayload();

  const project = await projectsService.getResearch(projectId); // TODO: replace with a call to projectReadModel
  const team = await teamsService.getResearchGroup(teamId);

  const notifiableUsers = await usersService.getUsers(ctx.state.tenant.admins);
  const currentUser = await usersService.getUser(ctx.state.user.username);

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

  await userNotificationsService.createUserNotifications(notifications);
});



module.exports = userNotificationEventHandler;