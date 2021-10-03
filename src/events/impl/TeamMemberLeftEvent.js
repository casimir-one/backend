import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class TeamMemberLeftEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      member,
      teamId
    } = eventPayload;

    assert(!!member, "'member' is required");
    assert(!!teamId, "'teamId' is required");

    super(APP_EVENT.TEAM_MEMBER_LEFT, eventPayload);
  }

}


module.exports = TeamMemberLeftEvent;