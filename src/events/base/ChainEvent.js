import { createEnum } from '@deip/toolbox';
import assert from "assert";
import APP_EVENT from "./AppEvent";
import BaseEvent from './BaseEvent';
import { logWarn } from "../../utils/log";

export const parseChainEvent = (rawEvent) => {
  assert(!!rawEvent.name, "ChainEvent should have name");
  const eventNum = chainEventToAppEvent[rawEvent.name];
  if (eventNum) {
    return new BaseEvent(eventNum, rawEvent.data)
  } else {
    logWarn(`ChainEvent '${rawEvent.name}' is not supported!`);
  }
}

const chainEventToAppEvent = createEnum({
  "block_created": APP_EVENT.CHAIN_BLOCK_CREATED,

  "proposal_proposed": APP_EVENT.CHAIN_PROPOSAL_PROPOSED,
  "proposal_approved": APP_EVENT.CHAIN_PROPOSAL_APPROVED,
  "proposal_revokedApproval": APP_EVENT.CHAIN_PROPOSAL_REVOKED_APPROVAL,
  "proposal_resolved": APP_EVENT.CHAIN_PROPOSAL_RESOLVED,
  "proposal_expired": APP_EVENT.CHAIN_PROPOSAL_EXPIRED,

  "project_created": APP_EVENT.CHAIN_PROJECT_CREATED,
  "project_removed": APP_EVENT.CHAIN_PROJECT_REMOVED,
  "project_updated": APP_EVENT.CHAIN_PROJECT_UPDATED,
  "project_contentCreated": APP_EVENT.CHAIN_PROJECT_CONTENT_CREATED,
  "project_ndaCreated": APP_EVENT.CHAIN_PROJECT_NDA_CREATED,
  "project_ndaAccessRequestCreated": APP_EVENT.CHAIN_PROJECT_NDA_ACCESS_REQUEST_CREATED,
  "project_ndaAccessRequestFulfilled": APP_EVENT.CHAIN_PROJECT_NDA_ACCESS_REQUEST_FULFILLED,
  "project_ndaAccessRequestRejected": APP_EVENT.CHAIN_PROJECT_NDA_ACCESS_REQUEST_REJECTED,
  "project_domainAdded": APP_EVENT.CHAIN_PROJECT_DOMAIN_ADDED,
  "project_reviewCreated": APP_EVENT.CHAIN_PROJECT_REVIEW_CREATED,
  "project_reviewUpvoted":  APP_EVENT.CHAIN_PROJECT_REVIEW_UPVOTED,
  "project_tokenSaleCreated": APP_EVENT.CHAIN_PROJECT_TOKEN_SALE_CREATED,
  "project_tokenSaleActivated": APP_EVENT.CHAIN_PROJECT_TOKEN_SALE_ACTIVATED,
  "project_tokenSaleFinished": APP_EVENT.CHAIN_PROJECT_TOKEN_SALE_FINISHED,
  "project_tokenSaleExpired": APP_EVENT.CHAIN_PROJECT_TOKEN_SALE_EXPIRED,
  "project_tokenSaleContributed": APP_EVENT.CHAIN_PROJECT_TOKEN_SALE_CONTRIBUTED,

  "deip_contractAgreementCreated": APP_EVENT.CHAIN_DEIP_CONTRACT_AGREEMENT_CREATED,
  "deip_contractAgreementAccepted": APP_EVENT.CHAIN_DEIP_CONTRACT_AGREEMENT_ACCEPTED,
  "deip_contractAgreementFinalized": APP_EVENT.CHAIN_DEIP_CONTRACT_AGREEMENT_FINALIZED,
  "deip_contractAgreementRejected": APP_EVENT.CHAIN_DEIP_CONTRACT_AGREEMENT_REJECTED,

  "dao_create": APP_EVENT.CHAIN_DAO_CREATE,
  "dao_alterAuthority": APP_EVENT.CHAIN_DAO_ALTER_AUTHORITY,
  "dao_metadataUpdated": APP_EVENT.CHAIN_DAO_METADATA_UPDATED,

  "asset_class_created": APP_EVENT.CHAIN_ASSET_CLASS_CREATED,
  "asset_issued": APP_EVENT.CHAIN_ASSET_ISSUED,
  "asset_transferred": APP_EVENT.CHAIN_ASSET_TRANSFERRED,
  "asset_burned": APP_EVENT.CHAIN_ASSET_BURNED,
  "asset_team_changed": APP_EVENT.CHAIN_ASSET_TEAM_CHANGED,
  "asset_owner_changed": APP_EVENT.CHAIN_ASSET_OWNER_CHANGED,
  "asset_account_frozen": APP_EVENT.CHAIN_ASSET_ACCOUNT_FROZEN,
  "asset_account_thawed": APP_EVENT.CHAIN_ASSET_ACCOUNT_THAWED,
  "asset_frozen": APP_EVENT.CHAIN_ASSET_FROZEN,
  "asset_thawed": APP_EVENT.CHAIN_ASSET_THAWED,
  "asset_class_destroyed": APP_EVENT.CHAIN_ASSET_CLASS_DESTROYED,
  "asset_class_force_created": APP_EVENT.CHAIN_ASSET_CLASS_FORCE_CREATED,
  "asset_metadata_set": APP_EVENT.CHAIN_ASSET_METADATA_SET,
  "octopus": APP_EVENT.CHAIN_OCTOPUS,
  "asset_metadata_cleared": APP_EVENT.CHAIN_ASSET_METADATA_CLEARED,
  "asset_approved_transfer": APP_EVENT.CHAIN_ASSET_APPROVED_TRANSFER,
  "asset_approval_cancelled": APP_EVENT.CHAIN_ASSET_APPROVAL_CANCELLED,
  "asset_transferred_approved": APP_EVENT.CHAIN_ASSET_TRANSFERRED_APPROVED,
  "asset_status_changed": APP_EVENT.CHAIN_ASSET_STATUS_CHANGED
});


// module.exports = ChainEvent;
