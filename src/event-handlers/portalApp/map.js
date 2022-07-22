import { APP_EVENT } from '@casimir/platform-core';
import {
  assetEventHandler,
  attributeEventHandler,
  documentTemplateEventHandler,
  fileUploadEventHandler,
  layoutEventHandler,
  portalEventHandler,
  proposalEventHandler,
  teamEventHandler,
  userEventHandler,
  mailEventHandler,
} from './index';

/* Priority is defined by the order of handlers */

module.exports = {

  [APP_EVENT.PROPOSAL_CREATED]: [
    { h: proposalEventHandler, await: true }
  ],

  [APP_EVENT.PROPOSAL_ACCEPTED]: [
    { h: proposalEventHandler, await: true }
  ],

  [APP_EVENT.PROPOSAL_DECLINED]: [
    { h: proposalEventHandler, await: true }
  ],

  [APP_EVENT.NFT_COLLECTION_METADATA_CREATED]: [
    { h: assetEventHandler, await: true }
  ],

  [APP_EVENT.NFT_COLLECTION_METADATA_UPDATED]: [
    { h: assetEventHandler, await: true }
  ],

  [APP_EVENT.DAO_MEMBER_ADDED]: [
    { h: teamEventHandler, await: true },
    { h: userEventHandler, await: true }
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
    { h: attributeEventHandler, await: true }
  ],

  [APP_EVENT.ATTRIBUTE_DELETED]: [
    { h: attributeEventHandler, await: true }
  ],

  [APP_EVENT.DAO_CREATED]: [
    { h: teamEventHandler, await: true },
    { h: userEventHandler, await: true },
    { h: mailEventHandler, await: true },
  ],

  [APP_EVENT.DAO_IMPORTED]: [
    { h: userEventHandler, await: true },
  ],

  [APP_EVENT.DAO_UPDATED]: [
    { h: teamEventHandler, await: true },
    { h: userEventHandler, await: true }
  ],

  [APP_EVENT.USER_AUTHORITY_ALTERED]: [
    { h: userEventHandler, await: true }
  ],

  [APP_EVENT.FT_CREATED]: [
    { h: assetEventHandler, await: false }
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

  [APP_EVENT.NFT_ITEM_METADATA_DRAFT_CREATED]: [
    { h: assetEventHandler, await: true }
  ],

  [APP_EVENT.NFT_ITEM_METADATA_DRAFT_UPDATED]: [
    { h: fileUploadEventHandler, await: true },
    { h: assetEventHandler, await: true }
  ],

  [APP_EVENT.NFT_ITEM_METADATA_DRAFT_STATUS_UPDATED]: [
    { h: assetEventHandler, await: true }
  ],

  [APP_EVENT.NFT_ITEM_METADATA_DRAFT_MODERATION_MSG_UPDATED]: [
    { h: assetEventHandler, await: true }
  ],

  [APP_EVENT.NFT_ITEM_METADATA_DRAFT_DELETED]: [
    { h: fileUploadEventHandler, await: true },
    { h: assetEventHandler, await: true }
  ],

  [APP_EVENT.NFT_ITEM_METADATA_CREATED]: [
    { h: assetEventHandler, await: true }
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

  [APP_EVENT.LAYOUT_CREATED]: [
    { h: layoutEventHandler, await: true },
  ],

  [APP_EVENT.LAYOUT_UPDATED]: [
    { h: layoutEventHandler, await: true },
  ],

  [APP_EVENT.LAYOUT_DELETED]: [
    { h: layoutEventHandler, await: true },
  ],

  [APP_EVENT.NFT_LAZY_SELL_PROPOSAL_CREATED]: [
    { h: proposalEventHandler, await: true }
  ],

  [APP_EVENT.NFT_LAZY_SELL_PROPOSAL_ACCEPTED]: [
    { h: proposalEventHandler, await: false }
  ],

  [APP_EVENT.NFT_LAZY_SELL_PROPOSAL_DECLINED]: [
    { h: proposalEventHandler, await: false }
  ],

  [APP_EVENT.NFT_LAZY_BUY_PROPOSAL_CREATED]: [
    { h: proposalEventHandler, await: true },
  ],

  [APP_EVENT.NFT_LAZY_BUY_PROPOSAL_ACCEPTED]: [
    { h: proposalEventHandler, await: false }
  ],

  [APP_EVENT.NFT_LAZY_BUY_PROPOSAL_DECLINED]: [
    { h: proposalEventHandler, await: false }
  ],
};
