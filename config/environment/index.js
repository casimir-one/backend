const _ = require('lodash');
const path = require('path');
const fs = require('fs');

const env = (process.env.USE_LOCAL_CONFIG || process.env.NODE_ENV == 'local')
    ? 'local'
    : process.env.NODE_ENV || 'development';

require('dotenv').config({
    path: __dirname + '/' +
        (env == 'production' ? '.prod.env' : env == 'development' ? '.dev.env' : '.local.env')
})

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
        accountsCreator: JSON.parse(process.env.FAUCET_ACCOUNT)
    },
    serverHost: process.env.DEIP_SERVER_URL,
    uiHost: process.env.DEIP_CLIENT_URL,
    sigSeed: process.env.SIG_SEED,
    jwtSecret: process.env.JWT_SECRET,
    sudoUsers: (process.env.SUDO_USERS || "").split(",").filter(u => u != ""),
    mailer: {
      gmailClientId: process.env.GMAIL_CLIENT_ID,
      gmailClientSecret: process.env.GMAIL_CLIENT_SECRET,
      gmailRefreshToken: process.env.GMAIL_REFRESH_TOKEN,
      gmailUser: process.env.GMAIL_USER,
      salesEmail: process.env.SALES_EMAIL,
    },
    stripe: {
      ipProtectionProductId: process.env.STRIPE_IP_PROTECTION_PRODUCT_ID,
      publicKey: process.env.STRIPE_PUBLIC_KEY,
      secretKey: process.env.STRIPE_SECRET_KEY,
      customerSubscriptionCreatedWebhookSigningKey: process.env.STRIPE_CUSTOMER_SUBSCRIPTION_CREATED_WEBHOOK_SIGNING_KEY,
      customerSubscriptionUpdatedWebhookSigningKey: process.env.STRIPE_CUSTOMER_SUBSCRIPTION_UPDATED_WEBHOOK_SIGNING_KEY,
      customerPaymentIntentSucceededWebhookSigningKey: process.env.STRIPE_CUSTOMER_PAYMENT_INTENT_SUCCEEDED_WEBHOOK_SIGNING_KEY
    }
  });

module.exports = config;