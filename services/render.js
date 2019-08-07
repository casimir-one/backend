const mustache = require('mustache');
const fs = require('fs');
const Promise = require('bluebird');

const readFileAsync = Promise.promisify(fs.readFile);

class RenderService {
  async registrationEmail(registrationUrl) {
    try {
      const contents = await readFileAsync(`${__dirname}/../data/emails/registration_email.html`, 'utf8')
      return mustache.render(contents, { registrationUrl });
    } catch (err) {
      console.error(err);
      return `Welcome!\nPlease follow this link to complete your registration: ${config.uiHost}/#/sign-up?token=${token}`;
    }
  }
}

module.exports = new RenderService();
