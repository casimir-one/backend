import { DOMAIN_EVENT } from '@casimir/platform-core';
import { createEnum } from '@deip/toolbox';
import assert from "assert";
import { logWarn } from "../../utils/log";
import BaseEvent from './BaseEvent';

export const parseChainEvent = (rawEvent) => {
  assert(!!rawEvent.name, "ChainEvent should have name");
  const eventNum = chainEventNameToDomainEventNum[rawEvent.name];
  if (eventNum) {
    return new BaseEvent(eventNum, rawEvent.data)
  } else {
    logWarn(`ChainEvent '${rawEvent.name}' is not supported!`);
  }
}

const chainEventNameToDomainEventNum = createEnum({
  // BASE
  "block_created": DOMAIN_EVENT.BLOCK_CREATED,
  "octopus": DOMAIN_EVENT.OCTOPUS,

  // NATIVE FT
  "native_ft_transfer": DOMAIN_EVENT.NATIVE_FT_TRANSFER,

  // PROPOSAL
  "proposal_proposed": DOMAIN_EVENT.PROPOSAL_CREATED,
  "proposal_approved": DOMAIN_EVENT.PROPOSAL_APPROVED,
  "proposal_revokedApproval": DOMAIN_EVENT.PROPOSAL_REVOKED_APPROVAL,
  "proposal_resolved": DOMAIN_EVENT.PROPOSAL_RESOLVED,
  "proposal_expired": DOMAIN_EVENT.PROPOSAL_EXPIRED,

  // DAO
  "dao_create": DOMAIN_EVENT.DAO_CREATE,
  "dao_alterAuthority": DOMAIN_EVENT.DAO_ALTER_AUTHORITY,
  "dao_metadataUpdated": DOMAIN_EVENT.DAO_METADATA_UPDATED,

  // FT
  "asset_class_created": DOMAIN_EVENT.FT_CLASS_CREATED,
  "asset_issued": DOMAIN_EVENT.FT_ISSUED,
  "asset_transferred": DOMAIN_EVENT.FT_TRANSFERRED,
  "asset_burned": DOMAIN_EVENT.FT_BURNED,
  "asset_team_changed": DOMAIN_EVENT.FT_TEAM_CHANGED,
  "asset_owner_changed": DOMAIN_EVENT.FT_OWNER_CHANGED,
  "asset_account_frozen": DOMAIN_EVENT.FT_ACCOUNT_FROZEN,
  "asset_account_thawed": DOMAIN_EVENT.FT_ACCOUNT_THAWED,
  "asset_frozen": DOMAIN_EVENT.FT_FROZEN,
  "asset_thawed": DOMAIN_EVENT.FT_THAWED,
  "asset_class_destroyed": DOMAIN_EVENT.FT_CLASS_DESTROYED,
  "asset_class_force_created": DOMAIN_EVENT.FT_CLASS_FORCE_CREATED,
  "asset_metadata_set": DOMAIN_EVENT.FT_METADATA_SET,
  "asset_metadata_cleared": DOMAIN_EVENT.FT_METADATA_CLEARED,
  "asset_approved_transfer": DOMAIN_EVENT.FT_APPROVED_TRANSFER,
  "asset_approval_cancelled": DOMAIN_EVENT.FT_APPROVAL_CANCELLED,
  "asset_transferred_approved": DOMAIN_EVENT.FT_TRANSFERRED_APPROVED,
  "asset_status_changed": DOMAIN_EVENT.FT_STATUS_CHANGED,

  //NFT
  "uniques_approval_canceled": DOMAIN_EVENT.NFT_APPROVAL_CANCELED,
  "uniques_approved_transfer": DOMAIN_EVENT.NFT_APPROVED_TRANSFER,
  "uniques_asset_status_changed": DOMAIN_EVENT.NFT_ASSET_STATUS_CHANGED,
  "uniques_attribute_cleared": DOMAIN_EVENT.NFT_ATTRIBUTE_CLEARED,
  "uniques_attribute_set": DOMAIN_EVENT.NFT_ATTRIBUTE_SET,
  "uniques_burned": DOMAIN_EVENT.NFT_BURNED,
  "uniques_class_frozen": DOMAIN_EVENT.NFT_CLASS_FROZEN,
  "uniques_class_metadata_cleared": DOMAIN_EVENT.NFT_CLASS_METADATA_CLEARED,
  "uniques_class_metadata_set": DOMAIN_EVENT.NFT_CLASS_METADATA_SET,
  "uniques_class_thawed": DOMAIN_EVENT.NFT_CLASS_THAWED,
  "uniques_created": DOMAIN_EVENT.NFT_COLLECTION_CREATED,
  "uniques_destroyed": DOMAIN_EVENT.NFT_DESTROYED,
  "uniques_force_created": DOMAIN_EVENT.NFT_FORCE_CREATED,
  "uniques_frozen": DOMAIN_EVENT.NFT_FROZEN,
  "uniques_issued": DOMAIN_EVENT.NFT_ISSUED,
  "uniques_metadata_cleared": DOMAIN_EVENT.NFT_METADATA_CLEARED,
  "uniques_metadata_set": DOMAIN_EVENT.NFT_METADATA_SET,
  "uniques_owner_changed": DOMAIN_EVENT.NFT_OWNER_CHANGED,
  "uniques_redeposited": DOMAIN_EVENT.NFT_REDEPOSITED,
  "uniques_team_changed": DOMAIN_EVENT.NFT_TEAM_CHANGED,
  "uniques_thawed": DOMAIN_EVENT.NFT_THAWED,
  "uniques_transferred": DOMAIN_EVENT.NFT_TRANSFERRED

});
