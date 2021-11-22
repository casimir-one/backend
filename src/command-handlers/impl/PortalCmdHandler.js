import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import {
  PortalProfileUpdatedEvent,
  PortalSettingsUpdatedEvent,
  LayoutUpdatedEvent,
  LayoutSettingsUpdatedEvent,
  AttributeSettingsUpdatedEvent,
  NetworkSettingsUpdatedEvent,
  UserProfileDeletedEvent
} from './../../events';

class PortalCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const portalCmdHandler = new PortalCmdHandler();

portalCmdHandler.register(APP_CMD.UPDATE_PORTAL_PROFILE, (cmd, ctx) => {
  const updatedData = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new PortalProfileUpdatedEvent({ ...updatedData, portalId: ctx.state.tenant.id }));
});

portalCmdHandler.register(APP_CMD.UPDATE_PORTAL_SETTINGS, (cmd, ctx) => {
  const updatedData = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new PortalSettingsUpdatedEvent({ ...updatedData, portalId: ctx.state.tenant.id }));
});

portalCmdHandler.register(APP_CMD.UPDATE_LAYOUT, (cmd, ctx) => {
  const updatedData = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new LayoutUpdatedEvent({ ...updatedData, portalId: ctx.state.tenant.id }));
});

portalCmdHandler.register(APP_CMD.UPDATE_LAYOUT_SETTINGS, (cmd, ctx) => {
  const updatedData = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new LayoutSettingsUpdatedEvent({ ...updatedData, portalId: ctx.state.tenant.id }));
});

portalCmdHandler.register(APP_CMD.UPDATE_ATTRIBUTE_SETTINGS, (cmd, ctx) => {
  const updatedData = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new AttributeSettingsUpdatedEvent({ ...updatedData, portalId: ctx.state.tenant.id }));
});

portalCmdHandler.register(APP_CMD.UPDATE_NETWORK_SETTINGS, (cmd, ctx) => {
  const updatedData = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new NetworkSettingsUpdatedEvent({ ...updatedData, portalId: ctx.state.tenant.id }));
});

portalCmdHandler.register(APP_CMD.DELETE_USER_PROFILE, (cmd, ctx) => {
  const { username } = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new UserProfileDeletedEvent({ username }));
});

module.exports = portalCmdHandler;