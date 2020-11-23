import assert from 'assert';
import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';
import ProposalEvent from './proposalEvent';

class AssetExchangeProposedEvent extends ProposalEvent(AppEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.ASSET_EXCHANGE_PROPOSED) {
    assert(onchainDatums.filter(([opName]) => opName == 'transfer').length == 2, "transfer_operation(s) are not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getSourceData() {
    let [opName1, opPayload1] = this.onchainDatums.filter(([opName]) => opName == 'transfer')[0];
    let [opName2, opPayload2] = this.onchainDatums.filter(([opName]) => opName == 'transfer')[1];

    let { from: party1, amount: asset1, memo: memo1 } = opPayload1;
    let { from: party2, amount: asset2, memo: memo2 } = opPayload2;

    return { party1, party2, asset2, asset1, memo1, memo2 };
  }
}

module.exports = AssetExchangeProposedEvent;