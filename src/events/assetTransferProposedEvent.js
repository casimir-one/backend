import assert from 'assert';
import { APP_EVENTS } from './../constants';
import AssetTransferredEvent from './assetTransferredEvent';
import ProposalEvent from './proposalEvent';

class AssetTransferProposedEvent extends ProposalEvent(AssetTransferredEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.ASSET_TRANSFER_PROPOSED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = AssetTransferProposedEvent;