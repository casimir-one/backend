import assert from 'assert';
import { LEGACY_APP_EVENTS } from './../../constants';
import AssetTransferredEvent from './assetTransferredEvent';
import ProposalEvent from './proposalEvent';

class AssetTransferProposedEvent extends ProposalEvent(AssetTransferredEvent) {
  constructor(onchainDatums, offchainMeta, eventName = LEGACY_APP_EVENTS.ASSET_TRANSFER_PROPOSED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = AssetTransferProposedEvent;