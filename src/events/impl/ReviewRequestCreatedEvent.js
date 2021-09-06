import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class ReviewRequestCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      expert,
      requestor,
      projectContentId
    } = eventPayload;

    assert(!!expert, "'expert' is required");
    assert(!!requestor, "'requestor' is required");
    assert(!!projectContentId, "'projectContentId' is required");

    super(APP_EVENT.REVIEW_REQUEST_CREATED, eventPayload);
  }

}

module.exports = ReviewRequestCreatedEvent;