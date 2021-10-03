import BaseEvent from '../base/BaseEvent';
import APP_EVENT from '../base/AppEvent';
import assert from 'assert';


class TeamMemberJoinedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      member,
      teamId
    } = eventPayload;

    assert(!!member, "'member' is required");
    assert(!!teamId, "'teamId' is required");

    super(APP_EVENT.TEAM_MEMBER_JOINED, eventPayload);
  }

}


module.exports = TeamMemberJoinedEvent;