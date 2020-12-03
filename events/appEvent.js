import assert from 'assert';

class AppEvent {
  constructor(onchainDatums, offchainMeta, appEventName) {
    assert(appEventName != null, "App event is not provided");
    this.appEventName = appEventName;
    this.onchainDatums = onchainDatums || [];
    this.offchainMeta = offchainMeta || {};
  }

  getAppEventName() { return this.appEventName; }
  getProposalId() { return null; }
  getProposalExpirationTime() { return null; }
  getProposalApprovals() { return []; }
  getSourceData() { 
    return { 
      source: {
        event: this.appEventName,
        onchain: this.onchainDatums, 
        offchain: this.offchainMeta 
      }
    };
  }
}

module.exports = AppEvent;