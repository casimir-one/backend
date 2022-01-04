import BaseEvent from '../base/BaseEvent';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';

class UpvotedReviewEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      entityId: upvoteReviewId,
      voter,
      reviewId,
      domainId,
      weight
    } = eventPayload;

    assert(!!upvoteReviewId, "'upvoteReviewId' is required");
    assert(!!voter, "'voter' is required");
    assert(!!reviewId, "'reviewId' is required");

    super(APP_EVENT.UPVOTED_REVIEW, eventPayload);
  }

}

module.exports = UpvotedReviewEvent;