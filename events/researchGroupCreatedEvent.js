import assert from 'assert';
import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';

class ResearchGroupCreatedEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_GROUP_CREATED) {
    assert(onchainDatums.some(([opName]) => opName == 'create_account'), "create_account_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getSourceData() {
    const [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'create_account');
    const { new_account_name: researchGroupExternalId, creator } = opPayload;
    return { researchGroupExternalId, creator } ;
  }
}

module.exports = ResearchGroupCreatedEvent;