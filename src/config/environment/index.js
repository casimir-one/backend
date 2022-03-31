const _ = require('lodash');
const path = require('path');
const fs = require('fs');
const FILE_STORAGE = require('./../../constants/fileStorage').default;
const { PROTOCOL_CHAIN } = require('@deip/constants');

const env = (process.env.DEIP_CONFIG || process.env.NODE_ENV == 'local')
  ? 'local'
  : process.env.NODE_ENV || 'development';

require('dotenv').config({
  path: __dirname + '/' +
    (env == 'production' ? '.prod.env' : env == 'development' ? '.dev.env' : process.env.DEIP_CONFIG ? ('.' + process.env.DEIP_CONFIG + '.env') : '.local.env')
});


function parseJsonEnvVar(jsonEnvVarName, defaultValue) {
  const jsonEnvVar = process.env[jsonEnvVarName];
  if (!jsonEnvVar && defaultValue === undefined)
    throw new Error(jsonEnvVarName + " json environment variable is not defined. Specify it in the config or provide a default value");
  return jsonEnvVar ? JSON.parse(jsonEnvVar) : defaultValue;
}


const config = {
  ENVIRONMENT: env,
  PROTOCOL: process.env.PROTOCOL ? parseInt(process.env.PROTOCOL) : PROTOCOL_CHAIN.GRAPHENE,
  TENANT: process.env.TENANT || '0000000000000000000000000000000000000000',
  TENANT_FILE_STORAGE_TYPE: process.env.TENANT_FILE_STORAGE_TYPE || FILE_STORAGE.LOCAL_FILESYSTEM,
  TENANT_SFTP_HOST: process.env.TENANT_SFTP_HOST,
  TENANT_SFTP_USER: process.env.TENANT_SFTP_USER,
  TENANT_SFTP_PASSWORD: process.env.TENANT_SFTP_PASSWORD,
  TENANT_FILES_DIR: process.env.TENANT_FILES_DIR || 'files',
  TENANT_LOG_DIR: process.env.TENANT_LOG_DIR || 'logs',
  TENANT_PORTAL: parseJsonEnvVar('TENANT_PORTAL'),

  DEIP_MONGO_STORAGE_CONNECTION_URL: process.env.DEIP_MONGO_STORAGE_CONNECTION_URL,

  DEIP_FULL_NODE_URL: process.env.DEIP_FULL_NODE_URL,
  DEIP_PAYMENT_SERVICE_URL: process.env.DEIP_PAYMENT_SERVICE_URL,
  DEIP_PAYMENT_SERVICE_PUB_KEY: process.env.DEIP_PAYMENT_SERVICE_PUB_KEY,
  TENANT_PRIV_KEY: process.env.TENANT_PRIV_KEY,
  CHAIN_ID: process.env.CHAIN_ID,
  CHAIN_BLOCK_INTERVAL_MILLIS: process.env.CHAIN_BLOCK_INTERVAL_MILLIS ? parseInt(process.env.CHAIN_BLOCK_INTERVAL_MILLIS) : 3000,
  FAUCET_ACCOUNT: parseJsonEnvVar('FAUCET_ACCOUNT'),
  CORE_ASSET: parseJsonEnvVar('CORE_ASSET'),
  DEIP_SERVER_URL: process.env.DEIP_SERVER_URL,
  DEIP_CLIENT_URL: process.env.DEIP_CLIENT_URL,
  SIG_SEED: process.env.SIG_SEED,
  JWT_SECRET: process.env.JWT_SECRET,

  QUEUE_SERVICE: process.env.QUEUE_SERVICE || "pubsub", //kafka | pubsub
  KAFKA_CLIENT_ID: "offchain-server",
  KAFKA_BROKER_URL: process.env.KAFKA_BROKER_URL,
  KAFKA_USER: process.env.KAFKA_USER,
  KAFKA_PASSWORD: process.env.KAFKA_PASSWORD,
  KAFKA_APP_GROUP_ID: process.env.KAFKA_APP_GROUP_ID,
  KAFKA_CHAIN_GROUP_ID: process.env.KAFKA_CHAIN_GROUP_ID
};


module.exports = config;
