const mustache = require('mustache');
const fs = require('fs');
const Promise = require('bluebird');
const config = require('./../config');

const readFileAsync = Promise.promisify(fs.readFile);

const DEFAULTS = {
  updatePreferencesUrl: `${config.uiHost}/account-settings/notifications`,
  unsubscribeUrl: `${config.uiHost}/account-settings/notifications?unsubscribe=true`,
};

class RenderService {
  async registrationEmail(registrationUrl) {
    try {
      const contents = await readFileAsync(`${__dirname}/../data/emails/registration_email.html`, 'utf8');
      return mustache.render(contents, { registrationUrl });
    } catch (err) {
      console.error(err);
      return `<p>Welcome!\nPlease follow this link to complete your registration: <a href="${registrationUrl}" traget="_blank">Confirm Email</a></p>`;
    }
  }

  async invitationEmail({ senderName, inviteUrl }) {
    try {
      const contents = await readFileAsync(`${__dirname}/../data/emails/user_invitation.html`, 'utf8');
      return mustache.render(contents, {
        ...DEFAULTS,
        inviteUrl,
        senderName
      });
    } catch (err) {
      console.error(err);
      return `<p>
        Hello! <br/>
        ${senderName} invites you to IP Ledger – a platform that helps protect your digital assets: <br/>
        <a href="${inviteUrl}" traget="_blank">Go to IP Ledger</a>
      </p>`;
    }
  }

  async ndaInvitationEmail({
    contractUrl, receiverName, senderName
  }) {
    try {
      const contents = await readFileAsync(`${__dirname}/../data/emails/nda_invitation.html`, 'utf8');
      return mustache.render(contents, {
        ...DEFAULTS,
        contractUrl,
        receiverName,
        senderName
      });
    } catch (err) {
      console.error(err);
      return `<p>Hello, ${receiverName}! ${senderName} invites you to sign NDA. Please follow link to review: <a href="${contractUrl}" traget="_blank">${contractUrl}</a></p>`;
    }
  }

  async ndaSignedEmail({
    receiverName, signeeName
  }) {
    try {
      const contents = await readFileAsync(`${__dirname}/../data/emails/nda_signed.html`, 'utf8');
      return mustache.render(contents, {
        ...DEFAULTS,
        receiverName,
        signeeName
      });
    } catch (err) {
      console.error(err);
      return `<p>Hello, ${receiverName}! ${signeeName} has signed a non-disclosure agreement.</p>`;
    }
  }

  async ndaDeclinedEmail({
    receiverName, signeeName
  }) {
    try {
      const contents = await readFileAsync(`${__dirname}/../data/emails/nda_declined.html`, 'utf8');
      return mustache.render(contents, {
        ...DEFAULTS,
        receiverName,
        signeeName
      });
    } catch (err) {
      console.error(err);
      return `<p>Hello, ${receiverName}! ${signeeName} has declined to sign a non-disclosure agreement.</p>`;
    }
  }

  async fileSharingInvitationEmail({
    sharedFileUrl, receiverName, senderName, fileName
  }) {
    try {
      const contents = await readFileAsync(`${__dirname}/../data/emails/file_sharing_invitation.html`, 'utf8');
      return mustache.render(contents, {
        ...DEFAULTS,
        sharedFileUrl,
        receiverName,
        senderName,
        fileName
      });
    } catch (err) {
      console.error(err);
      return `<p>Hello, ${receiverName}! ${senderName} wants to share a file ${fileName} with you. Please follow link to review: <a href="${sharedFileUrl}" traget="_blank">${sharedFileUrl}</a></p>`;
    }
  }

  async fileSharingRequestForAccessEmail({
    sharedFileUrl, receiverName, requesterName, fileName
  }) {
    try {
      const contents = await readFileAsync(`${__dirname}/../data/emails/file_sharing_request_for_access.html`, 'utf8');
      return mustache.render(contents, {
        ...DEFAULTS,
        sharedFileUrl,
        receiverName,
        requesterName,
        fileName
      });
    } catch (err) {
      console.error(err);
      return `<p>Hello, ${receiverName}! ${requesterName} requested access to a file ${fileName}. Please follow link to review: <a href="${sharedFileUrl}" traget="_blank">${sharedFileUrl}</a></p>`;
    }
  }

  async fileSharingAccessGrantedEmail({
    sharedFileUrl, receiverName, grantorName, fileName
  }) {
    try {
      const contents = await readFileAsync(`${__dirname}/../data/emails/file_sharing_access_granted.html`, 'utf8');
      return mustache.render(contents, {
        ...DEFAULTS,
        sharedFileUrl,
        receiverName,
        grantorName,
        fileName
      });
    } catch (err) {
      console.error(err);
      return `<p>Hello, ${receiverName}! ${grantorName} has granted you access to a file  ${fileName}. Please follow link to see: <a href="${sharedFileUrl}" traget="_blank">${sharedFileUrl}</a></p>`;
    }
  }
}

module.exports = new RenderService();
