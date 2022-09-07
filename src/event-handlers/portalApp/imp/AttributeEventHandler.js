import { APP_EVENT } from '@casimir.one/platform-core';
import { AttributeService, NFTCollectionDtoService } from '../../../services';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';


class AttributeEventHandler extends PortalAppEventHandler {

  constructor() {
    super();
  }

}

const attributeEventHandler = new AttributeEventHandler();
const attributeService = new AttributeService();
const nftCollectionDtoService = new NFTCollectionDtoService();

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