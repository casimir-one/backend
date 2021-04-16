import assert from 'assert';
import { APP_EVENTS } from './../../constants';
import AppEvent from './appEvent';

class ReviewCreatedEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_CREATED) {
    assert(onchainDatums.some(([opName]) => opName == 'create_review'), "create_review_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getSourceData() {
    const [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'create_review');
    const { external_id: reviewExternalId, research_content_external_id: researchContentExternalId, author } = opPayload;
    return { ...super.getSourceData(), ...this.offchainMeta, reviewExternalId, researchContentExternalId, author } ;
  }

}

module.exports = ReviewCreatedEvent;