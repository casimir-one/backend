import { APP_CMD } from '@deip/command-models';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { ProjectTokenSaleContridutedEvent, ProjectTokenSaleCreatedEvent } from './../../events';
import { USER_PROFILE_STATUS } from './../../constants';


class TokenSaleCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const tokenSaleCmdHandler = new TokenSaleCmdHandler();

tokenSaleCmdHandler.register(APP_CMD.CREATE_PROJECT_TOKEN_SALE, (cmd, ctx) => {

  const {
    teamId,
    projectId,
    startTime,
    endTime,
    securityTokensOnSale,
    softCap,
    hardCap,
    creator
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectTokenSaleCreatedEvent({
    teamId,
    projectId,
    startTime,
    endTime,
    securityTokensOnSale,
    softCap,
    hardCap,
    creator
  }));
});

tokenSaleCmdHandler.register(APP_CMD.CONTRIBUTE_PROJECT_TOKEN_SALE, (cmd, ctx) => {

  const {
    tokenSaleId,
    contributor,
    amount
  } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectTokenSaleContridutedEvent({
    tokenSaleId,
    contributor,
    amount
  }));
});

module.exports = tokenSaleCmdHandler;