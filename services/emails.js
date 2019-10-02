const nodemailer = require('nodemailer');
const config = require('./../config');
const renderService = require('./render');

const getShareFileUrl = (sharedFileId) => `${config.uiHost}/shared-files/${sharedFileId}`;

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

  async sendRegistrationEmail(to, token) {
    const confirmationUrl = `${config.uiHost}/sign-up?token=${token}`;
    const htmlToSend = await renderService.registrationEmail(confirmationUrl);
    console.log(`Email confirmation url: ${confirmationUrl}`);
    await this.sendMessage({
      to,
      subject: 'Activate your account',
      html: htmlToSend
    });
  }

  async sendInviteEmail(to, { senderName, inviteCode }) {
    const inviteUrl = `${config.serverHost}/public/invites/${inviteCode}`;
    console.log(`Invite url: ${inviteUrl}`);
    await this.sendMessage({
      to,
      subject: 'Invitation to wonderful DEIP world',
      html: `<p>
        Hi! ${senderName} invites you to join wonderful DEIP world <br />
        <a href="${inviteUrl}" target="_blank">Accept invite</a>
      </p>`
    });
  }

  async sendNewNDAContractEmail(to, {
    contractId, senderName, receiverName
  }) {
    const contractUrl = `${config.uiHost}/contracts/${contractId}`;
    const htmlToSend = await renderService.ndaInvitationEmail({
      contractUrl, senderName, receiverName
    });
    await this.sendMessage({
      to,
      subject: 'NDA Invitation',
      html: htmlToSend
    })
  }

  async sendNDASignedEmail(to, {
    receiverName, signeeName
  }) {
    const htmlToSend = await renderService.ndaSignedEmail({
      receiverName, signeeName
    });
    await this.sendMessage({
      to,
      subject: 'NDA Signed',
      html: htmlToSend
    })
  }

  async sendNDADeclinedEmail(to, {
    receiverName, signeeName
  }) {
    const htmlToSend = await renderService.ndaDeclinedEmail({
      receiverName, signeeName
    });
    await this.sendMessage({
      to,
      subject: 'NDA Declined',
      html: htmlToSend
    })
  }

  async sendNewFileSharedEmail(to, {
    sharedFileId, receiverName, senderName, fileName
  }) {
    const htmlToSend = await renderService.fileSharingInvitationEmail({
      sharedFileUrl: getShareFileUrl(sharedFileId),
      receiverName, senderName, fileName
    });
    await this.sendMessage({
      to,
      subject: 'File Sharing Invitation',
      html: htmlToSend
    })
  }

  async sendFileSharingRequestForAccessEmail(to, {
    sharedFileId, receiverName, requesterName, fileName
  }) {
    const htmlToSend = await renderService.fileSharingRequestForAccessEmail({
      sharedFileUrl: getShareFileUrl(sharedFileId),
      receiverName, requesterName, fileName
    });
    await this.sendMessage({
      to,
      subject: 'File Sharing Request For Access',
      html: htmlToSend
    })
  }

  async sendFileSharingAccessGrantedEmail(to, {
    sharedFileId, receiverName, grantorName, fileName
  }) {
    const htmlToSend = await renderService.fileSharingAccessGrantedEmail({
      sharedFileUrl: getShareFileUrl(sharedFileId),
      receiverName, grantorName, fileName
    });
    await this.sendMessage({
      to,
      subject: 'File Sharing Access Granted',
      html: htmlToSend
    })
  }
}

module.exports = new EmailsService();
