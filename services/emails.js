const nodemailer = require('nodemailer');
const config = require('./../config');

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
      from: config.mailer.gmailUser,
      to, subject, text, html,
    };

    try {
      await this.transporter.sendMail(message);
    } catch (err) {
      console.error(err);
      console.log(`Message: ${JSON.stringify(message, null, 2)}`);
    }
  }

  async sendRegistrationUrl(to, token) {
    await this.sendMessage({
      to,
      subject: 'IP Protection Platform Registration',
      html: `
        Hi there!
        Here is your invitation link: ${config.uiHost}/#/sign-up?token=${token}
      `
    });
  }
}

module.exports = new EmailsService();
