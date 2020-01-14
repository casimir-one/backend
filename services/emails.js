const nodemailer = require('nodemailer');
const moment = require('moment');
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
        name: 'IP Ledger',
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

  async sendRegistrationEmail(to, token, registrationPromoCode) {
    let confirmationUrl = `${config.uiHost}/sign-up?token=${token}`;
    if (registrationPromoCode) {
      confirmationUrl = `${confirmationUrl}&registration_promo_code=${registrationPromoCode}`;
    }
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
    const htmlToSend = await renderService.invitationEmail({
      inviteUrl, senderName
    });
    await this.sendMessage({
      to,
      subject: 'Invitation to IP Ledger',
      html: htmlToSend
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

  async sendNewUserRegisteredEmail({
    username, firstName, lastName,
    registrationPromoCode,
    pricingPlan,
  }) {
    try {
      await this.sendMessage({
        to: config.mailer.salesEmail,
        subject: 'New registration',
        html: `
          <p>
            <b>App</b>: ${config.uiHost}<br/>
            <b>username</b>: ${username}<br/>
            <b>First Name</b>: ${firstName}<br/>
            <b>Last Name</b>: ${lastName}<br/>
            <b>Pricing Plan</b>: ${pricingPlan}<br/>
            <b>Promo Code</b>: ${registrationPromoCode || 'None'} <br/>
            <b>Date</b>: ${moment().toISOString()}<br/>
          </p>
        `
      })
    } catch (err) {
    }
  }
}

module.exports = new EmailsService();
