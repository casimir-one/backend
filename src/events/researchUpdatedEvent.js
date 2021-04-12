import assert from 'assert';
import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';

class ResearchUpdatedEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_UPDATED) {
    assert(onchainDatums.some(([opName]) => opName == 'update_research'), "update_research_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getSourceData() {
    let [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'update_research');
    let { external_id: researchExternalId, research_group: researchGroupExternalId } = opPayload;
    return { ...super.getSourceData(), researchExternalId, researchGroupExternalId };
  }
}

module.exports = ResearchUpdatedEvent;