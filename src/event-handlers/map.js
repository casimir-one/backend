import APP_EVENT from './../events/base/AppEvent';
import { 
  projectEventHandler, 
  proposalEventHandler, 
  teamEventHandler, 
  userNotificationEventHandler, 
  userInviteEventHandler,
  attributeEventHandler,
  userEventHandler,
  documentTemplateEventHandler,
  tokenSaleEventHandler,
  assetEventHandler,
  projectContentEventHandler
} from './index';



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
    { h: teamEventHandler, await: true },
    { h: userEventHandler, await: true }
  ],

  [APP_EVENT.TEAM_UPDATED]: [
    { h: teamEventHandler, await: true }
  ],

  [APP_EVENT.PROJECT_CREATED]: [
    { h: projectEventHandler, await: true },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_UPDATED]: [
    { h: projectEventHandler, await: true },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_DELETED]: [
    { h: projectEventHandler, await: true }
  ],

  [APP_EVENT.PROJECT_MEMBER_JOINED]: [
    { h: projectEventHandler, await: true }
  ],

  [APP_EVENT.PROJECT_MEMBER_LEFT]: [
    { h: projectEventHandler, await: true }
  ],

  [APP_EVENT.PROJECT_PROPOSAL_CREATED]: [
    { h: proposalEventHandler, await: false },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_PROPOSAL_ACCEPTED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_UPDATE_PROPOSAL_CREATED]: [
    { h: proposalEventHandler, await: false },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_INVITE_CREATED]: [
    { h: proposalEventHandler, await: true },
    // { h: userInviteEventHandler, await: false },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_INVITE_ACCEPTED]: [
    // { h: userInviteEventHandler, await: false },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_INVITE_DECLINED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.TEAM_UPDATE_PROPOSAL_ACCEPTED]: [
    { h: proposalEventHandler, await: false }
  ],

  [APP_EVENT.TEAM_UPDATE_PROPOSAL_CREATED]: [
    { h: proposalEventHandler, await: false }
  ],

  [APP_EVENT.TEAM_UPDATE_PROPOSAL_DECLINED]: [
    { h: proposalEventHandler, await: false }
  ],

  [APP_EVENT.ATTRIBUTE_CREATED]: [
    { h: attributeEventHandler, await: true }
  ],

  [APP_EVENT.ATTRIBUTE_UPDATED]: [
    { h: attributeEventHandler, await: true },
    { h: projectEventHandler, await: true }
  ],

  [APP_EVENT.ATTRIBUTE_DELETED]: [
    { h: attributeEventHandler, await: true },
    { h: projectEventHandler, await: true },
  ],

  [APP_EVENT.USER_CREATED]: [
    { h: userEventHandler, await: true },
    { h: teamEventHandler, await: true },
    { h: projectEventHandler, await: false }
  ],

  [APP_EVENT.USER_UPDATED]: [
    { h: userEventHandler, await: true }
  ],

  [APP_EVENT.PROJECT_TOKEN_SALE_PROPOSAL_CREATED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_TOKEN_SALE_PROPOSAL_ACCEPTED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_TOKEN_SALE_PROPOSAL_DECLINED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_TOKEN_SALE_CREATED]: [
    { h: tokenSaleEventHandler, await: true },
    { h: projectEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_TOKEN_SALE_INVESTED]: [
    { h: projectEventHandler, await: false }
  ],

  [APP_EVENT.ASSET_TRANSFERED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.ASSET_CREATED]: [
    { h: assetEventHandler, await: false }
  ],

  [APP_EVENT.ASSET_ISSUED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.DOCUMENT_TEMPLATE_CREATED]: [
    { h: documentTemplateEventHandler, await: false }
  ],

  [APP_EVENT.DOCUMENT_TEMPLATE_UPDATED]: [
    { h: documentTemplateEventHandler, await: false }
  ],

  [APP_EVENT.DOCUMENT_TEMPLATE_DELETED]: [
    { h: documentTemplateEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_CONTENT_DRAFT_CREATED]: [
    { h: projectContentEventHandler, await: true }
  ],

  [APP_EVENT.PROJECT_CONTENT_DRAFT_UPDATED]: [
    { h: projectContentEventHandler, await: true }
  ],

  [APP_EVENT.PROJECT_CONTENT_DRAFT_DELETED]: [
    { h: projectContentEventHandler, await: true }
  ],

  [APP_EVENT.PROJECT_CONTENT_PROPOSAL_CREATED]: [
    { h: projectContentEventHandler, await: true },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_CONTENT_PROPOSAL_ACCEPTED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_CONTENT_PROPOSAL_DECLINED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_CONTENT_CREATED]: [
    { h: projectContentEventHandler, await: true },
    { h: userNotificationEventHandler, await: false }
  ]
};
