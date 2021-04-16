import assert from 'assert';
import { LEGACY_APP_EVENTS } from './../../constants';
import AppEvent from './appEvent';

class ResearchContentCreatedEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = LEGACY_APP_EVENTS.RESEARCH_CONTENT_CREATED) {
    assert(onchainDatums.some(([opName]) => opName == 'create_research_content'), "create_research_content_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getSourceData() {
    const [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'create_research_content');
    const { external_id: researchContentExternalId, research_group: researchGroupExternalId, research_external_id: researchExternalId, content: hash, authors, references } = opPayload;
    return { ...super.getSourceData(), researchContentExternalId, researchExternalId, researchGroupExternalId, hash, authors, references };
  }
}

module.exports = ResearchContentCreatedEvent;