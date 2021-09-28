import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { ContractAgreementCreatedEvent, ContractAgreementAcceptedEvent } from './../../events';

class ContractAgreementCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const contractAgreementCmdHandler = new ContractAgreementCmdHandler();

contractAgreementCmdHandler.register(APP_CMD.CREATE_CONTRACT_AGREEMENT, (cmd, ctx) => {

  const contractAgreementData = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ContractAgreementCreatedEvent(contractAgreementData));
});

contractAgreementCmdHandler.register(APP_CMD.ACCEPT_CONTRACT_AGREEMENT, (cmd, ctx) => {

  const payload = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ContractAgreementAcceptedEvent(payload));
});

module.exports = contractAgreementCmdHandler;