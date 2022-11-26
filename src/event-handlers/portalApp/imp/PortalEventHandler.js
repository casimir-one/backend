import { APP_EVENT } from '@casimir.one/platform-core';
import { PortalService } from '../../../services';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';


class PortalEventHandler extends PortalAppEventHandler {

  constructor() {
    super();
  }

}

const portalEventHandler = new PortalEventHandler();
const portalService = new PortalService();

portalEventHandler.register(APP_EVENT.PORTAL_PROFILE_UPDATED, async (event) => {
  const {
    name,
    shortName,
    description,
    email,
    settings: {},
    portalId
  } = event.getEventPayload();

  const portal = await portalService.getPortal(portalId);
  await portalService.updatePortal(
    portalId,
    {
      ...portal,
      name,
      shortName,
      description,
      email
    },
    {
      ...portal.settings
    }
  );
});

portalEventHandler.register(APP_EVENT.LAYOUT_SETTINGS_UPDATED, async (event) => {
  const { portalId, layoutMappings } = event.getEventPayload();
  await portalService.updatePortalLayoutMappings(
    portalId,
    layoutMappings
  );
});

portalEventHandler.register(APP_EVENT.ATTRIBUTE_SETTINGS_UPDATED, async (event) => {
  const { portalId, attributeMappings } = event.getEventPayload();

  const updatedPortalProfile = await portalService.updatePortalAttributeMappings(
    portalId,
    attributeMappings
  );
});

module.exports = portalEventHandler;