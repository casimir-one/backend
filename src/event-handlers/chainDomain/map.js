import { DOMAIN_EVENT } from '@casimir.one/platform-core';
import {
  ftEventHandler,
  blockEventHandler,
  daoEventHandler,
  proposalEventHandler,
  nativeFTEventHandler,
  nftEventHandler,
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
    { h: nativeFTEventHandler, await: false }
  ],

  // ## PROPOSAL

  [DOMAIN_EVENT.PROPOSAL_CREATED]: [
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
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_ISSUED]: [
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_TRANSFERRED]: [
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_BURNED]: [
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_TEAM_CHANGED]: [
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_OWNER_CHANGED]: [
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_ACCOUNT_FROZEN]: [
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_ACCOUNT_THAWED]: [
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_FROZEN]: [
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_THAWED]: [
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_CLASS_DESTROYED]: [
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_CLASS_FORCE_CREATED]: [
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_METADATA_SET]: [
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_METADATA_CLEARED]: [
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_APPROVED_TRANSFER]: [
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_TRANSFERRED_APPROVED]: [
    { h: ftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.FT_STATUS_CHANGED]: [
    { h: ftEventHandler, await: false }
  ],
  
  // ## NFT
  [DOMAIN_EVENT.NFT_APPROVAL_CANCELED]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_APPROVED_TRANSFER]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_ASSET_STATUS_CHANGED]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_ATTRIBUTE_CLEARED]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_ATTRIBUTE_SET]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_BURNED]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_CLASS_FROZEN]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_CLASS_METADATA_CLEARED]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_CLASS_METADATA_SET]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_CLASS_THAWED]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_COLLECTION_CREATED]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_DESTROYED]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_FORCE_CREATED]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_FROZEN]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_METADATA_CLEARED]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_METADATA_SET]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_OWNER_CHANGED]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_TEAM_CHANGED]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_THAWED]: [
    { h: nftEventHandler, await: false }
  ],
  [DOMAIN_EVENT.NFT_TRANSFERRED]: [
    { h: nftEventHandler, await: true }
  ],
};
