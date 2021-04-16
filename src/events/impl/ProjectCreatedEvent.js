import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from './../../constants';


class ProjectCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    super(APP_EVENT.PROJECT_CREATED, eventPayload);
  }

}


module.exports = ProjectCreatedEvent;