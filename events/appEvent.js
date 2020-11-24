import assert from 'assert';

class AppEvent {
  constructor(onchainDatums, offchainMeta, appEventName) {
    assert(appEventName != null, "App event is not provided");
    this.onchainDatums = onchainDatums || [];
    this.offchainMeta = offchainMeta || {};
    this.appEventName = appEventName;
  }

  getAppEventName() { return this.appEventName; }
  getProposalId() { return null; }
  getProposalExpirationTime() { return null; }
  getProposalApprovals() { return []; }
  getSourceData() { return null; }
}

module.exports = AppEvent;