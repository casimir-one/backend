import { DOMAIN_EVENT } from '@deip/constants';
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
  "block_created": DOMAIN_EVENT.BLOCK_CREATED,
  "octopus": DOMAIN_EVENT.OCTOPUS,

  "proposal_proposed": DOMAIN_EVENT.PROPOSAL_PROPOSED,
  "proposal_approved": DOMAIN_EVENT.PROPOSAL_APPROVED,
  "proposal_revokedApproval": DOMAIN_EVENT.PROPOSAL_REVOKED_APPROVAL,
  "proposal_resolved": DOMAIN_EVENT.PROPOSAL_RESOLVED,
  "proposal_expired": DOMAIN_EVENT.PROPOSAL_EXPIRED,

  "project_created": DOMAIN_EVENT.PROJECT_CREATED,
  "project_removed": DOMAIN_EVENT.PROJECT_REMOVED,
  "project_updated": DOMAIN_EVENT.PROJECT_UPDATED,
  "project_contentCreated": DOMAIN_EVENT.PROJECT_CONTENT_CREATED,
  "project_ndaCreated": DOMAIN_EVENT.PROJECT_NDA_CREATED,
  "project_ndaAccessRequestCreated": DOMAIN_EVENT.PROJECT_NDA_ACCESS_REQUEST_CREATED,
  "project_ndaAccessRequestFulfilled": DOMAIN_EVENT.PROJECT_NDA_ACCESS_REQUEST_FULFILLED,
  "project_ndaAccessRequestRejected": DOMAIN_EVENT.PROJECT_NDA_ACCESS_REQUEST_REJECTED,
  "project_domainAdded": DOMAIN_EVENT.PROJECT_DOMAIN_ADDED,
  "project_reviewCreated": DOMAIN_EVENT.PROJECT_REVIEW_CREATED,
  "project_reviewUpvoted": DOMAIN_EVENT.PROJECT_REVIEW_UPVOTED,
  "project_tokenSaleCreated": DOMAIN_EVENT.PROJECT_TOKEN_SALE_CREATED,
  "project_tokenSaleActivated": DOMAIN_EVENT.PROJECT_TOKEN_SALE_ACTIVATED,
  "project_tokenSaleFinished": DOMAIN_EVENT.PROJECT_TOKEN_SALE_FINISHED,
  "project_tokenSaleExpired": DOMAIN_EVENT.PROJECT_TOKEN_SALE_EXPIRED,
  "project_tokenSaleContributed": DOMAIN_EVENT.PROJECT_TOKEN_SALE_CONTRIBUTED,

  "deip_contractAgreementCreated": DOMAIN_EVENT.DEIP_CONTRACT_AGREEMENT_CREATED,
  "deip_contractAgreementAccepted": DOMAIN_EVENT.DEIP_CONTRACT_AGREEMENT_ACCEPTED,
  "deip_contractAgreementFinalized": DOMAIN_EVENT.DEIP_CONTRACT_AGREEMENT_FINALIZED,
  "deip_contractAgreementRejected": DOMAIN_EVENT.DEIP_CONTRACT_AGREEMENT_REJECTED,

  "dao_create": DOMAIN_EVENT.DAO_CREATE,
  "dao_alterAuthority": DOMAIN_EVENT.DAO_ALTER_AUTHORITY,
  "dao_metadataUpdated": DOMAIN_EVENT.DAO_METADATA_UPDATED,

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
  "asset_status_changed": DOMAIN_EVENT.FT_STATUS_CHANGED
});
