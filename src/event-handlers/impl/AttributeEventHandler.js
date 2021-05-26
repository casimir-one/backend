import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { AttributeService, ProjectDtoService } from './../../services';


class AttributeEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const attributeEventHandler = new AttributeEventHandler();
const attributeService = new AttributeService();
const projectDtoService = new ProjectDtoService();

attributeEventHandler.register(APP_EVENT.ATTRIBUTE_CREATED, async (event) => {

  const { tenantId, attribute } = event.getEventPayload();

  const newAttribute = await attributeService.createAttribute(tenantId, attribute);
});

attributeEventHandler.register(APP_EVENT.ATTRIBUTE_UPDATED, async (event) => {

  const { tenantId, attribute } = event.getEventPayload();

  const updatedAttribute = await attributeService.updateAttribute(tenantId, attribute);
});

attributeEventHandler.register(APP_EVENT.ATTRIBUTE_DELETED, async (event) => {

  const { tenantId, attributeId } = event.getEventPayload();

  const newAttribute = await attributeService.deleteAttribute(tenantId, { _id: attributeId });
});

module.exports = attributeEventHandler;