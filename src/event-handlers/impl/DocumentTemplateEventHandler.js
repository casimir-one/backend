import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { DocumentTemplateService } from './../../services';


class DocumentTemplateEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const documentTemplateEventHandler = new DocumentTemplateEventHandler();
const documentTemplateService = new DocumentTemplateService();

documentTemplateEventHandler.register(APP_EVENT.DOCUMENT_TEMPLATE_CREATED, async (event) => {

  const documentTemplate = event.getEventPayload();

  const newDocumentTemplate = await documentTemplateService.createDocumentTemplate(documentTemplate);
});

documentTemplateEventHandler.register(APP_EVENT.DOCUMENT_TEMPLATE_UPDATED, async (event) => {

  const documentTemplate = event.getEventPayload();

  const updatedDocumentTemplate = await documentTemplateService.updateDocumentTemplate(documentTemplate);
});

documentTemplateEventHandler.register(APP_EVENT.DOCUMENT_TEMPLATE_DELETED, async (event) => {

  const { documentTemplateId } = event.getEventPayload();

  const deletedDocumentTemplate = await documentTemplateService.deleteDocumentTemplate(documentTemplateId);
});

module.exports = documentTemplateEventHandler;