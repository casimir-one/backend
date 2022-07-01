import { APP_CMD } from '@casimir/platform-core';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { AttributeCreatedEvent, AttributeUpdatedEvent, AttributeDeletedEvent } from './../../events';

class AttributeCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const attributeCmdHandler = new AttributeCmdHandler();

attributeCmdHandler.register(APP_CMD.CREATE_ATTRIBUTE, (cmd, ctx) => {

  const attribute = cmd.getCmdPayload();

  ctx.state.appEvents.push(new AttributeCreatedEvent({ portalId: ctx.state.portal.id, attribute }));
});

attributeCmdHandler.register(APP_CMD.UPDATE_ATTRIBUTE, (cmd, ctx) => {

  const attribute = cmd.getCmdPayload();

  ctx.state.appEvents.push(new AttributeUpdatedEvent({ portalId: ctx.state.portal.id, attribute }));
});

attributeCmdHandler.register(APP_CMD.DELETE_ATTRIBUTE, (cmd, ctx) => {

  const { attributeId } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new AttributeDeletedEvent({ portalId: ctx.state.portal.id, attributeId }));
});

module.exports = attributeCmdHandler;