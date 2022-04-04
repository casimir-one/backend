import BaseEventHandler from './../base/BaseEventHandler';
import { APP_EVENT } from '@deip/constants';
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

  const { portalId, attribute } = event.getEventPayload();

  const newAttribute = await attributeService.createAttribute(portalId, attribute);
});

attributeEventHandler.register(APP_EVENT.ATTRIBUTE_UPDATED, async (event) => {

  const { portalId, attribute } = event.getEventPayload();

  const updatedAttribute = await attributeService.updateAttribute(portalId, attribute);
});

attributeEventHandler.register(APP_EVENT.ATTRIBUTE_DELETED, async (event) => {

  const { portalId, attributeId } = event.getEventPayload();

  const newAttribute = await attributeService.deleteAttribute(portalId, { _id: attributeId });
});

module.exports = attributeEventHandler;