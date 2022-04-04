import BaseEvent from './../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';


class ProjectDeletedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      projectId
    } = eventPayload;

    assert(!!projectId, "'projectId' is required");

    super(APP_EVENT.PROJECT_DELETED, eventPayload);
  }

}


module.exports = ProjectDeletedEvent;