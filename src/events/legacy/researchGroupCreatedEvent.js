import assert from 'assert';
import { LEGACY_APP_EVENTS } from './../../constants';
import AppEvent from './appEvent';

class ResearchGroupCreatedEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = LEGACY_APP_EVENTS.RESEARCH_GROUP_CREATED) {
    assert(onchainDatums.some(([opName]) => opName == 'create_account'), "create_account_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getSourceData() {
    const [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'create_account');
    const { new_account_name: researchGroupExternalId, creator } = opPayload;
    return { ...super.getSourceData(), ...this.offchainMeta, researchGroupExternalId, creator } ;
  }
}

module.exports = ResearchGroupCreatedEvent;