import assert from 'assert';
import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';

class AssetTransferredEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.ASSET_TRANSFERRED) {
    assert(onchainDatums.some(([opName]) => opName == 'transfer'), "transfer_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getEventModel() {
    let [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'transfer');
    let { from: party1, to: party2, amount: asset, memo } = opPayload;
    return { party1, party2, asset, memo };
  }
}

module.exports = AssetTransferredEvent;