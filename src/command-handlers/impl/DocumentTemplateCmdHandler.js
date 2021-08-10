import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { DocumentTemplateCreatedEvent, DocumentTemplateUpdatedEvent, DocumentTemplateDeletedEvent } from './../../events';

class DocumentTemplateCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const documentTemplateCmdHandler = new DocumentTemplateCmdHandler();

documentTemplateCmdHandler.register(APP_CMD.CREATE_DOCUMENT_TEMPLATE, (cmd, ctx) => {

  const documentTemplate = cmd.getCmdPayload();

  ctx.state.appEvents.push(new DocumentTemplateCreatedEvent({
    ...documentTemplate,
    creator: ctx.state.user.username,
    tenantId: ctx.state.tenant.id
  }));
});

documentTemplateCmdHandler.register(APP_CMD.UPDATE_DOCUMENT_TEMPLATE, (cmd, ctx) => {

  const documentTemplate = cmd.getCmdPayload();

  ctx.state.appEvents.push(new DocumentTemplateUpdatedEvent(documentTemplate));
});

documentTemplateCmdHandler.register(APP_CMD.DELETE_DOCUMENT_TEMPLATE, (cmd, ctx) => {

  const { documentTemplateId } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new DocumentTemplateDeletedEvent({ documentTemplateId }));
});

module.exports = documentTemplateCmdHandler;