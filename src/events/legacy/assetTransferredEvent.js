import assert from 'assert';
import { LEGACY_APP_EVENTS } from './../../constants';
import AppEvent from './appEvent';

class AssetTransferredEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = LEGACY_APP_EVENTS.ASSET_TRANSFERRED) {
    assert(onchainDatums.some(([opName]) => opName == 'transfer'), "transfer_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getSourceData() {
    let [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'transfer');
    let { from: party1, to: party2, amount: asset, memo } = opPayload;
    return { ...super.getSourceData(), party1, party2, asset, memo };
  }
}

module.exports = AssetTransferredEvent;