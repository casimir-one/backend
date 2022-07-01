import { APP_EVENT } from '@casimir/platform-core';
import { DocumentTemplateService } from '../../../services';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';


class DocumentTemplateEventHandler extends PortalAppEventHandler {

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