import { createEnum } from '@deip/toolbox';
import assert from "assert";
import APP_EVENT from "./AppEvent";
import BaseEvent from './BaseEvent';
import { logWarn } from "../../utils/log";

export const parseChainEvent = (rawEvent) => {
  assert(!!rawEvent.name, "ChainEvent should have name");
  const eventNum = chainEventToAppEvent[rawEvent.name];
  if (!eventNum) {
    logWarn(`ChainEvent '${rawEvent.name}' is not supported!`);
  } else
    return new BaseEvent(eventNum, rawEvent.data)
}

const chainEventToAppEvent = createEnum({
  "block_created": APP_EVENT.CHAIN_BLOCK_CREATED,
  // "proposal_proposed": 0,
  // "proposal_approved": 1,
  // "proposal_revokedApproval": 2,
  // "proposal_resolved": 3,
  // "proposal_expired": 4,
  // "project_created": APP_EVENT.CHAIN_PROJECT_CREATED,
  // "project_removed": 6,
  // "project_updated": 7,
  // "project_contentCreated": 8,
  // "project_ndaCreated": 9,
  // "project_ndaAccessRequestCreated": 10,
  // "project_ndaAccessRequestFulfilled": 11,
  // "project_ndaAccessRequestRejected": 12,
  // "project_domainAdded": 13,
  // "project_reviewCreated": 14,
  // "project_reviewUpvoted": 15,
  // "project_tokenSaleCreated": 16,
  // "project_tokenSaleActivated": 17,
  // "project_tokenSaleFinished": 18,
  // "project_tokenSaleExpired": 19,
  // "project_tokenSaleContributed": 20,
  // "deip_contractAgreementCreated": 21,
  // "deip_contractAgreementAccepted": 22,
  // "deip_contractAgreementFinalized": 23,
  // "deip_contractAgreementRejected": 24,
  "dao_create": APP_EVENT.CHAIN_DAO_CREATE,
  // "dao_alterAuthority": 26,
  // "dao_metadataUpdated": 27,
  // "asset_class_created": 28,
  // "asset_issued": 29,
  // "asset_transferred": 30,
  // "asset_burned": 31,
  // "asset_team_changed": 32,
  // "asset_owner_changed": 33,
  // "asset_account_frozen": 34,
  // "asset_account_thawed": 35,
  // "asset_frozen": 36,
  // "asset_thawed": 37,
  // "asset_class_destroyed": 38,
  // "asset_class_force_created": 39,
  // "asset_metadata_set": 40,
  // "octopus": 49,
  // "asset_metadata_cleared": 42,
  // "asset_approved_transfer": 44,
  // "asset_approval_cancelled": 46,
  // "asset_transferred_approved": 48,
  // "asset_status_changed": 50
});


// module.exports = ChainEvent;
