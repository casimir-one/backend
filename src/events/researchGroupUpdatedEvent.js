import assert from 'assert';
import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';

class ResearchGroupUpdatedEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_GROUP_UPDATED) {
    assert(onchainDatums.some(([opName]) => opName == 'update_account'), "update_account_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getSourceData() {
    const [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'update_account');
    const { account: researchGroupExternalId } = opPayload;
    return { ...super.getSourceData(), ...this.offchainMeta, researchGroupExternalId };
  }
}

module.exports = ResearchGroupUpdatedEvent;