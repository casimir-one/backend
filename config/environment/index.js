const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const FILE_STORAGE = require('./../../constants/fileStorage').default;

const env = (process.env.USE_LOCAL_CONFIG || process.env.USE_CONFIG || process.env.NODE_ENV == 'local')
  ? 'local'
  : process.env.NODE_ENV || 'development';

require('dotenv').config({
  path: __dirname + '/' +
    (env == 'production' ? '.prod.env' : env == 'development' ? '.dev.env' : process.env.USE_CONFIG ? ('.' + process.env.USE_CONFIG + '.env') : '.local.env')
});

const config = {
  ENVIRONMENT: env,

  TENANT: process.env.TENANT || '0000000000000000000000000000000000000000',
  TENANT_FILE_STORAGE_TYPE: process.env.TENANT_FILE_STORAGE_TYPE || FILE_STORAGE.LOCAL_FILESYSTEM,
  TENANT_SFTP_HOST: process.env.TENANT_SFTP_HOST,
  TENANT_SFTP_USER: process.env.TENANT_SFTP_USER,
  TENANT_SFTP_PASSWORD: process.env.TENANT_SFTP_PASSWORD,
  TENANT_LOCAL_DIR: process.env.TENANT_LOCAL_DIR || 'files',

  DEIP_MONGO_STORAGE_CONNECTION_URL: process.env.DEIP_MONGO_STORAGE_CONNECTION_URL,

  DEIP_FULL_NODE_URL: process.env.DEIP_FULL_NODE_URL,
  DEIP_PAYMENT_SERVICE_URL: process.env.DEIP_PAYMENT_SERVICE_URL,
  DEIP_PAYMENT_SERVICE_PUB_KEY: process.env.DEIP_PAYMENT_SERVICE_PUB_KEY,
  TENANT_PRIV_KEY: process.env.TENANT_PRIV_KEY,
  CHAIN_ID: process.env.CHAIN_ID,
  FAUCET_ACCOUNT: JSON.parse(process.env.FAUCET_ACCOUNT),
  DEIP_SERVER_URL: process.env.DEIP_SERVER_URL,
  DEIP_CLIENT_URL: process.env.DEIP_CLIENT_URL, // todo: get rid of this
  SIG_SEED: process.env.SIG_SEED,
  JWT_SECRET: process.env.JWT_SECRET
};

module.exports = config;