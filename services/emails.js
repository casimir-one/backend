const nodemailer = require('nodemailer');
const config = require('./../config');
const renderService = require('./render');

class EmailsService {
  constructor() {
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        type: 'OAuth2',
        user: config.mailer.gmailUser,
        clientId: config.mailer.gmailClientId,
        clientSecret: config.mailer.gmailClientSecret,
        refreshToken: config.mailer.gmailRefreshToken,
      },
    });
  }

  async sendMessage({ to, subject, text, html }) {
    const message = {
      from: {
        name: 'DEIP IP Protection Platform',
        address: config.mailer.gmailUser,
      },
      to, subject, text, html,
    };

    if (config.environment === 'local') {
      // console.log(`Message: ${JSON.stringify(message, null, 2)}`);
      return;
    }

    try {
      await this.transporter.sendMail(message);
    } catch (err) {
      console.error(err);
      console.log(`Message: ${JSON.stringify(message, null, 2)}`);
    }
  }

  async sendRegistrationUrl(to, token) {
    const confirmationUrl = `${config.uiHost}/#/sign-up?token=${token}`;
    const htmlToSend = await renderService.registrationEmail(confirmationUrl);
    console.log(confirmationUrl);
    await this.sendMessage({
      to,
      subject: 'Activate your account',
      html: htmlToSend
    });
  }
}

module.exports = new EmailsService();
