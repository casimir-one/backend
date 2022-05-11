import { DOMAIN_EVENT } from '@deip/constants';
import { 
  fungibleTokenEventHandler,
  blockEventHandler,
  contractAgreementEventHandler,
  daoEventHandler,
  projectContentEventHandler,
  projectDomainEventHandler,
  projectEventHandler,
  projectInvestmentOpportunityEventHandler,
  projectNdaEventHandler,
  projectReviewEventHandler,
  proposalEventHandler,
} from './index';


/* Priority is defined by the order of handlers */

module.exports = {

  // ## BLOCK
  [DOMAIN_EVENT.BLOCK_CREATED]: [
    { h: blockEventHandler, await: false }
  ],
  // ## OCTOPIS
  [DOMAIN_EVENT.OCTOPUS]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  
  // ## PROPOSAL
  
  [DOMAIN_EVENT.PROPOSAL_PROPOSED]: [
    { h: proposalEventHandler, await: false }
  ],
  [DOMAIN_EVENT.PROPOSAL_APPROVED]: [
    { h: proposalEventHandler, await: false }
  ],
  [DOMAIN_EVENT.PROPOSAL_REVOKED_APPROVAL]: [
    { h: proposalEventHandler, await: false }
  ],
  [DOMAIN_EVENT.PROPOSAL_RESOLVED]: [
    { h: proposalEventHandler, await: false }
  ],
  [DOMAIN_EVENT.PROPOSAL_EXPIRED]: [
    { h: proposalEventHandler, await: false }
  ],

  // ## PROJECT
  [DOMAIN_EVENT.PROJECT_CREATED]: [
    { h: projectEventHandler, await: false }
  ],
  [DOMAIN_EVENT.PROJECT_REMOVED]: [
    { h: projectEventHandler, await: false }
  ],
  [DOMAIN_EVENT.PROJECT_UPDATED]: [
    { h: projectEventHandler, await: false }
  ],

  // ## PROJECT-CONTENT
  [DOMAIN_EVENT.PROJECT_CONTENT_CREATED]: [
    { h: projectContentEventHandler, await: false }
  ],
  // ## PROJECT-NDA
  [DOMAIN_EVENT.PROJECT_NDA_CREATED]: [
    { h: projectNdaEventHandler, await: false }
  ],
  [DOMAIN_EVENT.PROJECT_NDA_ACCESS_REQUEST_CREATED]: [
    { h: projectNdaEventHandler, await: false }
  ],
  [DOMAIN_EVENT.PROJECT_NDA_ACCESS_REQUEST_FULFILLED]: [
    { h: projectNdaEventHandler, await: false }
  ],
  [DOMAIN_EVENT.PROJECT_NDA_ACCESS_REQUEST_REJECTED]: [
    { h: projectNdaEventHandler, await: false }
  ],
  // ## PROJECT-DOMAIN
  [DOMAIN_EVENT.PROJECT_DOMAIN_ADDED]: [
    { h: projectDomainEventHandler, await: false }
  ],
  // ## PROJECT-REVIEW
  [DOMAIN_EVENT.PROJECT_REVIEW_CREATED]: [
    { h: projectReviewEventHandler, await: false }
  ],
  [DOMAIN_EVENT.PROJECT_REVIEW_UPVOTED]: [
    { h: projectReviewEventHandler, await: false }
  ],

  // ## PROJECT-INVESTMENT-OPPOTUNITY
  [DOMAIN_EVENT.PROJECT_TOKEN_SALE_CREATED]: [
    { h: projectInvestmentOpportunityEventHandler, await: false }
  ],
  [DOMAIN_EVENT.PROJECT_TOKEN_SALE_ACTIVATED]: [
    { h: projectInvestmentOpportunityEventHandler, await: false }
  ],
  [DOMAIN_EVENT.PROJECT_TOKEN_SALE_FINISHED]: [
    { h: projectInvestmentOpportunityEventHandler, await: false }
  ],
  [DOMAIN_EVENT.PROJECT_TOKEN_SALE_EXPIRED]: [
    { h: projectInvestmentOpportunityEventHandler, await: false }
  ],
  [DOMAIN_EVENT.PROJECT_TOKEN_SALE_CONTRIBUTED]: [
    { h: projectInvestmentOpportunityEventHandler, await: false }
  ],

  // ## DEIP-CONTRACT-AGREEMENT
  [DOMAIN_EVENT.DEIP_CONTRACT_AGREEMENT_CREATED]: [
    { h: contractAgreementEventHandler, await: false }
  ],
  [DOMAIN_EVENT.DEIP_CONTRACT_AGREEMENT_ACCEPTED]: [
    { h: contractAgreementEventHandler, await: false }
  ],
  [DOMAIN_EVENT.DEIP_CONTRACT_AGREEMENT_FINALIZED]: [
    { h: contractAgreementEventHandler, await: false }
  ],
  [DOMAIN_EVENT.DEIP_CONTRACT_AGREEMENT_REJECTED]: [
    { h: contractAgreementEventHandler, await: false }
  ],

  // ## DAO
  [DOMAIN_EVENT.DAO_CREATE]: [
    { h: daoEventHandler, await: false }
  ],
  [DOMAIN_EVENT.DAO_ALTER_AUTHORITY]: [
    { h: daoEventHandler, await: false }
  ],
  [DOMAIN_EVENT.DAO_METADATA_UPDATED]: [
    { h: daoEventHandler, await: false }
  ],

  // ## FT
  [DOMAIN_EVENT.FT_CLASS_CREATED]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_ISSUED]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_TRANSFERRED]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_BURNED]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_TEAM_CHANGED]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_OWNER_CHANGED]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_ACCOUNT_FROZEN]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_ACCOUNT_THAWED]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_FROZEN]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_THAWED]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_CLASS_DESTROYED]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_CLASS_FORCE_CREATED]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_METADATA_SET]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_METADATA_CLEARED]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_APPROVED_TRANSFER]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_TRANSFERRED_APPROVED]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_STATUS_CHANGED]: [
    { h: fungibleTokenEventHandler, await: false }
  ],
};
