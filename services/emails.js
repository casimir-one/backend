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
    const confirmationUrl = `${config.uiHost}/sign-up?token=${token}`;
    const htmlToSend = await renderService.registrationEmail(confirmationUrl);
    console.log(confirmationUrl);
    await this.sendMessage({
      to,
      subject: 'Activate your account',
      html: htmlToSend
    });
  }

  async sendNDASignRequest(to, contractId) {
    const contractUrl = `${config.uiHost}/contract/${contractId}`;
    console.log(contractUrl);
    await this.sendMessage({
      to,
      subject: 'New NDA Contract',
      html: `
        <p>
          Hi! There is new NDA contract for you. Follow link to see:<br />
          <a href="${contractUrl}" traget="_blank">${contractUrl}</a>
        </p>`
    })
  }

  async sendFileSharedNotification(to, sharedFileId) {
    const fileUrl = `${config.uiHost}/shared-files/${sharedFileId}`;
    console.log(fileUrl);
    await this.sendMessage({
      to,
      subject: 'New Shared File',
      html: `
        <p>
          Hi! There is new shared file with you. Follow link to see:<br />
          <a href="${fileUrl}" traget="_blank">${fileUrl}</a>
        </p>`
    })
  }
}

module.exports = new EmailsService();
