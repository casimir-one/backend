import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import { RegistrationCodeSendedByEmailEvent } from './../../events';

class MailCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const mailCmdHandler = new MailCmdHandler();

mailCmdHandler.register(APP_CMD.SEND_REGISTRATION_CODE_BY_EMAIL, (cmd, ctx) => {
  const data = cmd.getCmdPayload();

  ctx.state.appEvents.push(new RegistrationCodeSendedByEmailEvent(data));
});

module.exports = mailCmdHandler;