import APP_EVENT from './../events/base/AppEvent';
import projectEventHandler from './impl/ProjectEventHandler';
import proposalEventHandler from './impl/ProposalEventHandler';
import teamEventHandler from './impl/TeamEventHandler';
import userNotificationEventHandler from './impl/UserNotificationEventHandler';
import userInviteEventHandler from './impl/UserInviteEventHandler';


/* Priority is defined by the order of handlers */

module.exports = {

  [APP_EVENT.PROPOSAL_CREATED]: [
    { h: proposalEventHandler, await: true }
  ],

  [APP_EVENT.PROPOSAL_UPDATED]: [
    { h: proposalEventHandler, await: true }
  ],

  [APP_EVENT.PROPOSAL_DECLINED]: [
    { h: proposalEventHandler, await: true }
  ],

  [APP_EVENT.TEAM_CREATED]: [
    { h: teamEventHandler, await: true }
  ],

  [APP_EVENT.PROJECT_CREATED]: [
    { h: projectEventHandler, await: true },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_MEMBER_JOINED]: [
    { h: projectEventHandler, await: true }
  ],

  [APP_EVENT.PROJECT_PROPOSAL_CREATED]: [
    { h: proposalEventHandler, await: false },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_PROPOSAL_ACCEPTED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_INVITE_CREATED]: [
    { h: proposalEventHandler, await: true },
    { h: userInviteEventHandler, await: false },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_INVITE_ACCEPTED]: [
    { h: userInviteEventHandler, await: false },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_INVITE_DECLINED]: [
    { h: userNotificationEventHandler, await: false }
  ]
};
