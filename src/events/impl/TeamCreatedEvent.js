import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from './../../constants';
import assert from 'assert';

class TeamCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      accountId,
      attributes
    } = eventPayload;

    assert(!!accountId, "'accountId' is required");
    // assert(!!attributes && attributes.length, "'attributes' required");

    super(APP_EVENT.TEAM_CREATED, eventPayload);
  }

}


module.exports = TeamCreatedEvent;