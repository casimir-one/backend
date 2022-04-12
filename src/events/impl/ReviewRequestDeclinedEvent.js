import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';

class ReviewRequestDeclinedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      reviewRequestId
    } = eventPayload;

    assert(!!reviewRequestId, "'reviewRequestId' is required");

    super(APP_EVENT.REVIEW_REQUEST_DECLINED, eventPayload);
  }

}

module.exports = ReviewRequestDeclinedEvent;