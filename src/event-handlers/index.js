import { APP_EVENT } from './../constants';
import projectEventHandler from './impl/ProjectEventHandler';
import proposalEventHandler from './impl/ProposalEventHandler';
import userNotificationEventHandler from './impl/UserNotificationEventHandler';


/* Priority is defined by the order of handlers */

module.exports = {

  [APP_EVENT.PROJECT_CREATED]: [
    { h: projectEventHandler, await: true },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROPOSAL_CREATED]: [
    { h: proposalEventHandler, await: true }
  ]

};
