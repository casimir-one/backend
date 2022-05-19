import { APP_EVENT } from '@deip/constants';
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
    settings: {
      faq
    },
    portalId
  } = event.getEventPayload();

  const portal = await portalService.getPortal(portalId);
  const updatedPortalProfile = await portalService.updatePortalProfile(
    portalId,
    {
      ...portal,
      name,
      shortName,
      description,
      email
    },
    {
      ...portal.settings,
      faq
    }
  );
});

portalEventHandler.register(APP_EVENT.PORTAL_SETTINGS_UPDATED, async (event) => {
  const { title, banner, logo, portalId } = event.getEventPayload();

  const updatedPortalProfile = await portalService.updatePortalProfile(portalId, {
    banner,
    logo,
    name: title
  }, {});
});

portalEventHandler.register(APP_EVENT.LAYOUT_UPDATED, async (event) => {
  const { portalId, layout } = event.getEventPayload();

  const updatedPortalProfile = await portalService.updatePortalLayouts(
    portalId,
    layout
  );
});

portalEventHandler.register(APP_EVENT.LAYOUT_SETTINGS_UPDATED, async (event) => {
  const { portalId, layoutSettings } = event.getEventPayload();

  const updatedPortalProfile = await portalService.updatePortalLayoutSettings(
    portalId,
    layoutSettings
  );
});

portalEventHandler.register(APP_EVENT.ATTRIBUTE_SETTINGS_UPDATED, async (event) => {
  const { portalId, attributeSettings } = event.getEventPayload();

  const updatedPortalProfile = await portalService.updatePortalAttributeSettings(
    portalId,
    attributeSettings
  );
});

portalEventHandler.register(APP_EVENT.NETWORK_SETTINGS_UPDATED, async (event) => {
  const { portalId, networkSettings } = event.getEventPayload();

  const updatedPortalProfile = await portalService.updatePortalNetworkSettings(
    portalId,
    networkSettings
  );
});

module.exports = portalEventHandler;