import nodemailer from 'nodemailer';
import config from './../config';
export * from './defaultMessageSettings';

const auth = {
  type: config.EMAIL_CONECTION.type || 'login',
  user: config.EMAIL_CONECTION.user
};

if (auth.type === 'oauth2') {
  auth.refreshToken = config.EMAIL_CONECTION.refreshToken
  auth.clientId = config.EMAIL_CONECTION.clientId
  auth.clientSecret = config.EMAIL_CONECTION.clientSecret
} 

if (auth.type === 'login') {
  auth.pass = config.EMAIL_CONECTION.password
} 

export const transporter = nodemailer.createTransport(
  {
    service: config.EMAIL_CONECTION.service,
    auth
  },
  {
    from: `DEIP ${config.EMAIL_CONECTION.user}`
  }
);