import { DOMAIN_EVENT } from '@deip/constants';
import {
  fungibleTokenEventHandler,
  blockEventHandler,
  daoEventHandler,
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
