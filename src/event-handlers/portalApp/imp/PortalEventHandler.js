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
  // todo: update logo and title only
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
  await portalService.updatePortalAttributeMappings(
    portalId,
    attributeMappings
  );
});


portalEventHandler.register(APP_EVENT.PORTAL_SETTINGS_UPDATED, async (event) => {
  const { portalId, customFields } = event.getEventPayload();
  await portalService.updatePortalCustomFields(
    portalId,
    customFields
  );
});

module.exports = portalEventHandler;