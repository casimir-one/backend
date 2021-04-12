import assert from 'assert';
import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';

class ReviewRequestedEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_REQUESTED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ReviewRequestedEvent;