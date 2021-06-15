import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';


class ProjectMemberLeftEvent extends BaseEvent {

  constructor(eventPayload) {
    super(APP_EVENT.PROJECT_MEMBER_LEFT, eventPayload);
  }

}


module.exports = ProjectMemberLeftEvent;