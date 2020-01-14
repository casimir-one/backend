const axios = require('axios');
const crypto = require('crypto');
const config = require('./../config');

class MailchimpService {
  constructor() {
    this._http = axios.create({
      baseURL: config.mailchimp.baseUrl,
      auth: {
        username: 'ipledger',
        password: config.mailchimp.apiKey
      },
    });
  }

  getMemberIdFromEmail(email) {
    if (!email || typeof email !== 'string') {
      throw new Error(`Email should be non-empty string; got ${email}`);
    }
    return crypto.createHash('md5').update(email.toLowerCase()).digest('hex');
  }

  async createCustomEventForMemberById(id, eventName, eventData = {}) {
    try {
      await this._http.post(`/members/${id}/events`, {
        name: eventName,
        properties: eventData,
      });
    } catch (err) {
    }
  }

  async createCustomEventForMemberByEmail(email, eventName, eventData = {}) {
    await this.createCustomEventForMemberById(
      this.getMemberIdFromEmail(email),
      eventName,
      eventData
    )
  }
}

module.exports = new MailchimpService();