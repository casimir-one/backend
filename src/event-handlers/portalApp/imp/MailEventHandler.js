import PortalAppEventHandler from '../../base/PortalAppEventHandler';
import { APP_EVENT } from '@casimir.one/platform-core';
import { VERIFICATION_TOKEN_LIFETIME } from './../../../constants';
import {
  VerificationTokenService
} from './../../../services';
import { genSha256Hash, genRipemd160Hash } from '@casimir.one/toolbox';
import { transporter, defaultMailOptionsForConfirmRegistration } from './../../../nodemailer';
import config from './../../../config';
import crypto from 'crypto'


class MailEventHandler extends PortalAppEventHandler {

  constructor() {
    super();
  }

}

const mailEventHandler = new MailEventHandler();
const verificationTokenService = new VerificationTokenService();

mailEventHandler.register(APP_EVENT.REGISTRATION_CODE_SENDED_BY_EMAIL, async (event) => {
  const { email } = event.getEventPayload();

  let confirmationCode = '';
  for (let i = 0; i < 6; i++) confirmationCode += crypto.randomInt(10);

  const refId = genRipemd160Hash(email);
  const oldToken = await verificationTokenService.getTokenByRefId(refId);
  if (oldToken) {
    await verificationTokenService.deleteTokenById(oldToken._id)
  }

  const mailOptions = defaultMailOptionsForConfirmRegistration({ email, confirmationCode });
  await transporter.sendMail(mailOptions)

  await verificationTokenService.createToken({
    token: genSha256Hash(confirmationCode),
    refId,
    expirationTime: new Date().getTime() + VERIFICATION_TOKEN_LIFETIME
  })
});

mailEventHandler.register(APP_EVENT.DAO_CREATED, async (event) => {
  const { confirmationCode, email, isTeamAccount } = event.getEventPayload();
  if (config.NEED_CONFIRM_REGISTRATION && !isTeamAccount) {
    await verificationTokenService.deleteTokenByTokenHash(genSha256Hash(confirmationCode))
  }
});

module.exports = mailEventHandler;