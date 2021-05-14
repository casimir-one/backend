import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class TeamUpdatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      accountId: teamId,
      attributes
    } = eventPayload;

    assert(!!teamId, "'teamId' is required");
    assert(!!attributes && attributes.length, "'attributes' required");

    super(APP_EVENT.TEAM_UPDATED, eventPayload);
  }

}


module.exports = TeamUpdatedEvent;