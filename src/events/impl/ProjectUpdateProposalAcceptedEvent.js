import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';


class ProjectUpdateProposalAcceptedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {} = eventPayload;

    super(APP_EVENT.PROJECT_UPDATE_PROPOSAL_ACCEPTED, eventPayload);
  }

}


module.exports = ProjectUpdateProposalAcceptedEvent;