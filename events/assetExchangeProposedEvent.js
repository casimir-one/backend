import assert from 'assert';
import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';

class AssetExchangeProposedEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.ASSET_EXCHANGE_PROPOSED) {
    assert(onchainDatums.some(([opName]) => opName == 'create_proposal'), "create_proposal_operation is not provided");
    assert(onchainDatums.filter(([opName]) => opName == 'transfer').length == 2, "transfer_operation(s) are not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getProposalId() {
    let [opName, { external_id: proposalId }] = this.onchainDatums.find(([opName]) => opName == 'create_proposal');
    return proposalId;
  }

  getEventModel() {
    let [opName1, opPayload1] = this.onchainDatums.filter(([opName]) => opName == 'transfer')[0];
    let [opName2, opPayload2] = this.onchainDatums.filter(([opName]) => opName == 'transfer')[1];

    let { from: party1, amount: asset1, memo: memo1 } = opPayload1;
    let { from: party2, amount: asset2, memo: memo2 } = opPayload2;

    return { party1, party2, asset2, asset1, memo1, memo2 };
  }

  getProposalApprovals() {
    const proposalId = this.getProposalId();
    return this.onchainDatums.filter(([opName, opPayload]) => opName == 'update_proposal' && opPayload.external_id == proposalId);
  }
}

module.exports = AssetExchangeProposedEvent;