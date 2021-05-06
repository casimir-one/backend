import assert from 'assert';
import { LEGACY_APP_EVENTS } from './../../constants';
import AppEvent from './appEvent';

class ReviewRequestedEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = LEGACY_APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_REQUESTED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ReviewRequestedEvent;