import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class ReviewCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId: reviewId,
      author,
      projectContentId,
      content,
      weight,
      assessment,
      disciplines
    } = eventPayload;

    assert(!!author, "'author' is required");
    assert(!!projectContentId, "'projectContentId' is required");
    assert(!!content, "'content' is required");
    assert(!!reviewId, "'reviewId' is required");

    super(APP_EVENT.REVIEW_CREATED, eventPayload);
  }

}

module.exports = ReviewCreatedEvent;