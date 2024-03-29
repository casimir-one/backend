import { APP_CMD } from '@casimir.one/platform-core';
import BaseCmdHandler from './../base/BaseCmdHandler';
import {
  PortalProfileUpdatedEvent,
  PortalSettingsUpdatedEvent,
  LayoutUpdatedEvent,
  LayoutSettingsUpdatedEvent,
  AttributeSettingsUpdatedEvent,
  NetworkSettingsUpdatedEvent
} from './../../events';

class PortalCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const portalCmdHandler = new PortalCmdHandler();

portalCmdHandler.register(APP_CMD.UPDATE_PORTAL_PROFILE, (cmd, ctx) => {
  const updatedData = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new PortalProfileUpdatedEvent({ ...updatedData, portalId: ctx.state.portal.id }));
});

portalCmdHandler.register(APP_CMD.UPDATE_PORTAL_SETTINGS, (cmd, ctx) => {
  const updatedData = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new PortalSettingsUpdatedEvent({ ...updatedData, portalId: ctx.state.portal.id }));
});

portalCmdHandler.register(APP_CMD.UPDATE_LAYOUT, (cmd, ctx) => {
  const layout = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new LayoutUpdatedEvent({ layout, portalId: ctx.state.portal.id }));
});

portalCmdHandler.register(APP_CMD.UPDATE_LAYOUT_SETTINGS, (cmd, ctx) => {
  const layoutSettings = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new LayoutSettingsUpdatedEvent({ layoutSettings, portalId: ctx.state.portal.id }));
});

portalCmdHandler.register(APP_CMD.UPDATE_ATTRIBUTE_SETTINGS, (cmd, ctx) => {
  const attributeSettings = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new AttributeSettingsUpdatedEvent({ attributeSettings, portalId: ctx.state.portal.id }));
});

portalCmdHandler.register(APP_CMD.UPDATE_NETWORK_SETTINGS, (cmd, ctx) => {
  const networkSettings = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new NetworkSettingsUpdatedEvent({ networkSettings, portalId: ctx.state.portal.id }));
});

module.exports = portalCmdHandler;