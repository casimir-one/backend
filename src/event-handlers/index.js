import { APP_EVENT } from './../constants';
import projectEventHandler from './impl/ProjectEventHandler';
import proposalEventHandler from './impl/ProposalEventHandler';
import teamEventHandler from './impl/TeamEventHandler';
import userNotificationEventHandler from './impl/UserNotificationEventHandler';


/* Priority is defined by the order of handlers */

module.exports = {

  [APP_EVENT.PROJECT_CREATED]: [
    { h: projectEventHandler, await: true },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROPOSAL_CREATED]: [
    { h: proposalEventHandler, await: true }
  ],

  [APP_EVENT.PROPOSAL_SIGNATURES_UPDATED]: [
    { h: proposalEventHandler, await: true }
  ],
  
  [APP_EVENT.PROJECT_MEMBER_JOINED]: [
    { h: projectEventHandler, await: true }
  ],

  [APP_EVENT.TEAM_CREATED]: [
    { h: teamEventHandler, await: true }
  ]

};
