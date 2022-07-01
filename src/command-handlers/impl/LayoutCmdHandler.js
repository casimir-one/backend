import { APP_CMD } from '@casimir/platform-core';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { LayoutCreatedEvent, LayoutUpdatedEvent, LayoutDeletedEvent } from './../../events';

class LayoutCmdHandler extends BaseCmdHandler {
  constructor() {
    super();
  }
}

const layoutCmdHandler = new LayoutCmdHandler();

layoutCmdHandler.register(APP_CMD.CREATE_LAYOUT, (cmd, ctx) => {
  const layout = cmd.getCmdPayload();

  ctx.state.appEvents.push(new LayoutCreatedEvent(layout));
});

layoutCmdHandler.register(APP_CMD.UPDATE_LAYOUT, (cmd, ctx) => {
  const layout = cmd.getCmdPayload();

  ctx.state.appEvents.push(new LayoutUpdatedEvent(layout));
});

layoutCmdHandler.register(APP_CMD.DELETE_LAYOUT, (cmd, ctx) => {
  const { layoutId } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new LayoutDeletedEvent({ layoutId }));
});

module.exports = layoutCmdHandler;