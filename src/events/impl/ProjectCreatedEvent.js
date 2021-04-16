import BaseEvent from './../base/BaseEvent';
import { EVENT } from './../../constants';


class ProjectCreatedEvent extends BaseEvent {

  constructor(eventPayload) {
    super(EVENT.PROJECT_CREATED, eventPayload);
  }

}


module.exports = ProjectCreatedEvent;