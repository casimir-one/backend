import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import FileStorage from './../../storage';
import { AttributeService, ProjectDtoService, PortalService } from './../../services';


class PortalEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const portalEventHandler = new PortalEventHandler();
const portalService = new PortalService();
const projectDtoService = new ProjectDtoService();

portalEventHandler.register(APP_EVENT.PORTAL_PROFILE_UPDATED, async (event) => {
  const {
    name,
    shortName,
    description,
    email,
    settings,
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
      ...settings
    }
  );
});

portalEventHandler.register(APP_EVENT.PORTAL_SETTINGS_UPDATED, async (event) => {
  const { title, banner, logo, portalId } = event.getEventPayload();
  
  const portal = await portalService.getPortal(portalId);
  const oldBanner = portal.banner;
  const oldLogo = portal.logo;

  const update = {
    banner: banner ? banner : portal.banner,
    logo: logo ? logo : portal.logo,
    name: title ? title : portal.name
  }

  const updatedPortalProfile = await portalService.updatePortalProfile(portalId, update, {});

  if (banner && oldBanner != banner) {
    const oldFilepath = FileStorage.getPortalBannerFilePath(portalId, oldBanner);
    const exists = await FileStorage.exists(oldFilepath);
    if (exists) {
      await FileStorage.delete(oldFilepath);
    }
  }

  if (logo && oldLogo != logo) {
    const oldFilepath = FileStorage.getPortalLogoFilePath(portalId, oldLogo);
    const exists = await FileStorage.exists(oldFilepath);
    if (exists) {
      await FileStorage.delete(oldFilepath);
    }
  }
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