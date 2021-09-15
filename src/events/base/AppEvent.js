import { createEnum } from '@deip/toolbox/lib/enum';

const APP_EVENT = createEnum({
  PROJECT_CREATED: 1,
  PROJECT_UPDATED: 2,
  PROJECT_DELETED: 3,
  PROJECT_MEMBER_JOINED: 4,

  PROPOSAL_CREATED: 5,
  PROPOSAL_UPDATED: 6,
  PROPOSAL_DECLINED: 7,

  TEAM_CREATED: 8,
  TEAM_UPDATED: 9,

  PROJECT_INVITE_CREATED: 10,
  PROJECT_INVITE_ACCEPTED: 11,
  PROJECT_INVITE_DECLINED: 12,

  PROJECT_PROPOSAL_CREATED: 13,
  PROJECT_PROPOSAL_ACCEPTED: 14,
  PROJECT_PROPOSAL_DECLINED: 15,

  PROJECT_UPDATE_PROPOSAL_CREATED: 16,
  PROJECT_UPDATE_PROPOSAL_ACCEPTED: 17,
  PROJECT_UPDATE_PROPOSAL_DECLINED: 18,

  TEAM_UPDATE_PROPOSAL_ACCEPTED: 19,
  TEAM_UPDATE_PROPOSAL_CREATED: 20,
  TEAM_UPDATE_PROPOSAL_DECLINED: 21,

  ATTRIBUTE_CREATED: 22,
  ATTRIBUTE_UPDATED: 23,
  ATTRIBUTE_DELETED: 24,

  USER_CREATED: 25,
  USER_UPDATED: 26,
  
  PROJECT_MEMBER_LEFT: 27,

  PROJECT_TOKEN_SALE_PROPOSAL_CREATED: 28,
  PROJECT_TOKEN_SALE_PROPOSAL_ACCEPTED: 29,
  PROJECT_TOKEN_SALE_PROPOSAL_DECLINED: 30,

  PROJECT_TOKEN_SALE_CREATED: 31,
  PROJECT_TOKEN_SALE_INVESTED: 32,

  ASSET_TRANSFERED: 33,
  ASSET_CREATED: 34,
  ASSET_ISSUED: 35,
  ASSET_TRANSFER_PROPOSAL_CREATED: 36,
  ASSET_TRANSFER_PROPOSAL_ACCEPTED: 37,
  ASSET_TRANSFER_PROPOSAL_DECLINED: 38,
  ASSET_EXCHANGE_PROPOSAL_CREATED: 39,
  ASSET_EXCHANGE_PROPOSAL_ACCEPTED: 40,
  ASSET_EXCHANGE_PROPOSAL_DECLINED: 41,

  DOCUMENT_TEMPLATE_CREATED: 42,
  DOCUMENT_TEMPLATE_UPDATED: 43,
  DOCUMENT_TEMPLATE_DELETED: 44,

  PROJECT_CONTENT_DRAFT_CREATED: 45,
  PROJECT_CONTENT_DRAFT_UPDATED: 46,
  PROJECT_CONTENT_DRAFT_DELETED: 47,
  PROJECT_CONTENT_CREATED: 48,
  PROJECT_CONTENT_PROPOSAL_CREATED: 49,
  PROJECT_CONTENT_PROPOSAL_ACCEPTED: 50,
  PROJECT_CONTENT_PROPOSAL_DECLINED: 51,

  REVIEW_REQUEST_CREATED: 52,
  REVIEW_REQUEST_DECLINED: 53,
  REVIEW_CREATED: 54,
  UPVOTED_REVIEW: 55,

  PROJECT_NDA_CREATED: 56,
  PROJECT_NDA_PROPOSAL_CREATED: 57,
  PROJECT_NDA_PROPOSAL_ACCEPTED: 58,
  PROJECT_NDA_PROPOSAL_DECLINED: 59

});


module.exports = APP_EVENT;