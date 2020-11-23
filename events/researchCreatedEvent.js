import assert from 'assert';
import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';

class ResearchCreatedEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_CREATED) {
    assert(onchainDatums.some(([opName]) => opName == 'create_research'), "create_research_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getSourceData() {
    let [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'create_research');
    let { external_id: researchExternalId, title: researchTitle, research_group: researchGroupExternalId } = opPayload;
    let { attributes } = this.offchainMeta;
    return { researchExternalId, researchTitle, researchGroupExternalId, attributes };
  }
}

module.exports = ResearchCreatedEvent;