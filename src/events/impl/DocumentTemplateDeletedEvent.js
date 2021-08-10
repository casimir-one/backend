import BaseEvent from './../base/BaseEvent';
import APP_EVENT from './../../events/base/AppEvent';
import assert from 'assert';

class DocumentTemplateDeletedEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      documentTemplateId
    } = eventPayload;

    assert(!!documentTemplateId, "'documentTemplateId' is required");

    super(APP_EVENT.DOCUMENT_TEMPLATE_DELETED, eventPayload);
  }

}

module.exports = DocumentTemplateDeletedEvent;