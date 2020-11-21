import assert from 'assert';
import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';

class ResearchContentCreatedEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_CONTENT_CREATED) {
    assert(onchainDatums.some(([opName]) => opName == 'create_research_content'), "create_research_content_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getEventModel() {
    const [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'create_research_content');
    const { external_id: researchContentExternalId, research_group: researchGroupExternalId, research_external_id: researchExternalId, title } = opPayload;
    return { researchContentExternalId, researchExternalId, researchGroupExternalId, title };
  }
}

module.exports = ResearchContentCreatedEvent;