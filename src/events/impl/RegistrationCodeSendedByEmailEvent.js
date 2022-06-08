import BaseEvent from '../base/BaseEvent';
import { APP_EVENT } from '@deip/constants';
import assert from 'assert';

class RegistrationCodeSendedByEmailEvent extends BaseEvent {

  constructor(eventPayload) {
    const {
      email
    } = eventPayload;

    assert(!!email, "'email' is required");

    super(APP_EVENT.REGISTRATION_CODE_SENDED_BY_EMAIL, eventPayload);
  }

}

module.exports = RegistrationCodeSendedByEmailEvent;