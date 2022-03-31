import { APP_EVENT } from '@deip/constants';
import { 
  projectEventHandler, 
  proposalEventHandler, 
  teamEventHandler, 
  userNotificationEventHandler, 
  userInviteEventHandler,
  attributeEventHandler,
  userEventHandler,
  documentTemplateEventHandler,
  investmentOpportunityEventHandler,
  assetEventHandler,
  projectContentEventHandler,
  reviewEventHandler,
  contractAgreementEventHandler,
  fileUploadEventHandler,
  portalEventHandler,
  userSettingsEventHandler,
  layoutEventHandler,
  onChainEventHandler
} from './index';



/* Priority is defined by the order of handlers */

module.exports = {

  [APP_EVENT.PROPOSAL_CREATED]: [
    { h: proposalEventHandler, await: true }
  ],

  [APP_EVENT.PROPOSAL_ACCEPTED]: [
    { h: proposalEventHandler, await: true },
    { h: contractAgreementEventHandler, await: true }
  ],

  [APP_EVENT.PROPOSAL_DECLINED]: [
    { h: proposalEventHandler, await: true }
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

  [APP_EVENT.TEAM_INVITE_CREATED]: [
    { h: proposalEventHandler, await: true },
    { h: userInviteEventHandler, await: false },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.TEAM_INVITE_ACCEPTED]: [
    { h: userInviteEventHandler, await: false },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.TEAM_INVITE_DECLINED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.DAO_MEMBER_ADDED]: [
    { h: teamEventHandler, await: true },
    { h: userEventHandler, await: true }
  ],

  [APP_EVENT.LEAVE_TEAM_CREATED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.LEAVE_TEAM_ACCEPTED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.LEAVE_TEAM_DECLINED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.DAO_MEMBER_REMOVED]: [
    { h: teamEventHandler, await: true },
    { h: userEventHandler, await: true }
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

  [APP_EVENT.DAO_CREATED]: [
    { h: teamEventHandler, await: true },
    { h: userEventHandler, await: true }
  ],

  [APP_EVENT.DAO_UPDATED]: [
    { h: teamEventHandler, await: true },
    { h: userEventHandler, await: true }
  ],

  [APP_EVENT.USER_AUTHORITY_ALTERED]: [
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

  [APP_EVENT.INVESTMENT_OPPORTUNITY_CREATED]: [
    { h: investmentOpportunityEventHandler, await: true },
    { h: projectEventHandler, await: false }
  ],

  [APP_EVENT.INVESTMENT_OPPORTUNITY_PARTICIPATED]: [
    { h: investmentOpportunityEventHandler, await: true },
    { h: projectEventHandler, await: false }
  ],

  [APP_EVENT.FT_TRANSFERED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.NFT_TRANSFERED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.FT_CREATED]: [
    { h: assetEventHandler, await: false }
  ],

  [APP_EVENT.NFT_CREATED]: [
    { h: assetEventHandler, await: false }
  ],

  [APP_EVENT.FT_ISSUED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.NFT_ISSUED]: [
    { h: assetEventHandler, await: true },
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
    { h: fileUploadEventHandler, await: true },
    { h: projectContentEventHandler, await: true }
  ],

  [APP_EVENT.PROJECT_CONTENT_DRAFT_UPDATED]: [
    { h: fileUploadEventHandler, await: true },
    { h: projectContentEventHandler, await: true }
  ],

  [APP_EVENT.PROJECT_CONTENT_DRAFT_DELETED]: [
    { h: fileUploadEventHandler, await: true },
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
  ],

  [APP_EVENT.REVIEW_REQUEST_CREATED]: [
    { h: reviewEventHandler, await: true },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.REVIEW_REQUEST_DECLINED]: [
    { h: reviewEventHandler, await: false }
  ],

  [APP_EVENT.REVIEW_CREATED]: [
    { h: reviewEventHandler, await: true },
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.UPVOTED_REVIEW]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_NDA_CREATED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_NDA_PROPOSAL_CREATED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.PROJECT_NDA_PROPOSAL_DECLINED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.CONTRACT_AGREEMENT_PROPOSAL_CREATED]: [
    { h: contractAgreementEventHandler, await: true },
    { h: fileUploadEventHandler, await: true }
  ],

  [APP_EVENT.CONTRACT_AGREEMENT_PROPOSAL_ACCEPTED]: [
    { h: userNotificationEventHandler, await: false }
  ],

  [APP_EVENT.CONTRACT_AGREEMENT_PROPOSAL_DECLINED]: [
    { h: contractAgreementEventHandler, await: true },
  ],

  [APP_EVENT.CONTRACT_AGREEMENT_CREATED]: [
    { h: contractAgreementEventHandler, await: true },
    { h: fileUploadEventHandler, await: true }
  ],

  [APP_EVENT.CONTRACT_AGREEMENT_ACCEPTED]: [
    { h: contractAgreementEventHandler, await: true },
  ],

  [APP_EVENT.CONTRACT_AGREEMENT_REJECTED]: [
    { h: contractAgreementEventHandler, await: true },
  ],

  [APP_EVENT.PORTAL_PROFILE_UPDATED]: [
    { h: portalEventHandler, await: true },
  ],

  [APP_EVENT.PORTAL_SETTINGS_UPDATED]: [
    { h: fileUploadEventHandler, await: true },
    { h: portalEventHandler, await: true }
  ],

  [APP_EVENT.LAYOUT_SETTINGS_UPDATED]: [
    { h: portalEventHandler, await: true },
  ],

  [APP_EVENT.ATTRIBUTE_SETTINGS_UPDATED]: [
    { h: portalEventHandler, await: true },
  ],

  [APP_EVENT.NETWORK_SETTINGS_UPDATED]: [
    { h: portalEventHandler, await: true },
  ],

  [APP_EVENT.USER_PROFILE_DELETED]: [
    { h: userEventHandler, await: true },
  ],

  [APP_EVENT.BOOKMARK_CREATED]: [
    { h: userSettingsEventHandler, await: true },
  ],

  [APP_EVENT.BOOKMARK_DELETED]: [
    { h: userSettingsEventHandler, await: true },
  ],

  [APP_EVENT.NOTIFICATIONS_MARKED_AS_READ]: [
    { h: userNotificationEventHandler, await: true },
  ],

  [APP_EVENT.LAYOUT_CREATED]: [
    { h: layoutEventHandler, await: true },
  ],

  [APP_EVENT.LAYOUT_UPDATED]: [
    { h: layoutEventHandler, await: true },
  ],

  [APP_EVENT.LAYOUT_DELETED]: [
    { h: layoutEventHandler, await: true },
  ],

  [APP_EVENT.CHAIN_BLOCK_CREATED]: [
    {h: onChainEventHandler, await: false }
  ],

  [APP_EVENT.CHAIN_PROJECT_CREATED]: [
    {h: onChainEventHandler, await: false }
  ],

  [APP_EVENT.CHAIN_DAO_CREATE]: [
    {h: onChainEventHandler, await: true }
  ]
};
