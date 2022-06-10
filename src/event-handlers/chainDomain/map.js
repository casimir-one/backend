import { DOMAIN_EVENT } from '@deip/constants';
import {
  fungibleTokenEventHandler,
  blockEventHandler,
  contractAgreementEventHandler,
  daoEventHandler,
  projectDomainEventHandler,
  projectInvestmentOpportunityEventHandler,
  projectNdaEventHandler,
  projectReviewEventHandler,
  proposalEventHandler,
  nativeFungibleTokenEventHandler,
  nonFungibleTokenEventHandler,
} from './index';


/* Priority is defined by the order of handlers */

module.exports = {

  // ## BLOCK
  [DOMAIN_EVENT.BLOCK_CREATED]: [
    { h: blockEventHandler, await: false }
  ],

  // ## OCTOPIS
  [DOMAIN_EVENT.OCTOPUS]: [],

  // ## NATIVE_FT
  [DOMAIN_EVENT.NATIVE_FT_TRANSFER]: [
    { h: nativeFungibleTokenEventHandler, await: false }
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
  
  // ## NFT
  [DOMAIN_EVENT.NFT_APPROVAL_CANCELED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_APPROVED_TRANSFER]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_ASSET_STATUS_CHANGED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_ATTRIBUTE_CLEARED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_ATTRIBUTE_SET]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_BURNED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_CLASS_FROZEN]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_CLASS_METADATA_CLEARED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_CLASS_METADATA_SET]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_CLASS_THAWED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_COLLECTION_CREATED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_DESTROYED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_FORCE_CREATED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_FROZEN]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_ISSUED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_METADATA_CLEARED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_METADATA_SET]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_OWNER_CHANGED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_REDEPOSITED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_TEAM_CHANGED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_THAWED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_TRANSFERRED]: [
    { h: nonFungibleTokenEventHandler, await: false }
  ],
};
