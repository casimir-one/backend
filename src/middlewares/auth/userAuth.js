import jwt from 'koa-jwt';
import config from './../../config';


function userAuth(options) {
  return jwt({
    secret: config.JWT_SECRET,
    getToken: function (opts) {
      if (opts.request.query && opts.request.query.authorization) {
        return opts.request.query.authorization;
      }
      return null;
    }
  });
}

module.exports = userAuth;