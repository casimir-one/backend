const _ = require('lodash');
const path = require('path');
const fs = require('fs');

const env = ( process.env.USE_LOCAL_CONFIG || process.env.NODE_ENV == 'local') 
    ? 'local' 
    : process.env.NODE_ENV || 'development';

require('dotenv').config({ path:  __dirname + '/' + 
    (env == 'production' ? '.prod.env' : env == 'development' ? '.dev.env' : '.local.env') })

let config = {
    environment: env
};

config = _.merge(config, {
    mongo: {
        "deip-server": {
            connection: process.env.DEIP_MONGO_STORAGE_CONNECTION_URL
        }
    },
    blockchain: {
        rpcEndpoint: process.env.DEIP_FULL_NODE_URL,
        chainId: process.env.CHAIN_ID,
        accountsCreator : JSON.parse(process.env.FAUCET_ACCOUNT)
    },
    SERVER_HOST: process.env.DEIP_SERVER_URL,
    CLIENT_URL: process.env.DEIP_CLIENT_URL, // todo: get rid of this
    SIG_SEED: process.env.SIG_SEED,
    JWT_SECRET: process.env.JWT_SECRET,
    FILE_STORAGE_DIR: process.env.FILE_STORAGE_DIR || 'files',
    TENANT: process.env.TENANT || '0000000000000000000000000000000000000000'
});

module.exports = config;