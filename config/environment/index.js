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
        accountsCreator : process.env.FAUCET_ACCOUNT
    },
    serverHost: process.env.SERVER_HOST,
    uiHost: process.env.UI_HOST, // todo: get rid of this
    sigSeed: process.env.SIG_SEED,
    jwtSecret: process.env.JWT_SECRET
});

module.exports = config;