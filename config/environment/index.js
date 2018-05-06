const _ = require('lodash');
const path = require('path');
const fs = require('fs');

const env = process.env.NODE_ENV || 'development';

let base = {
    env,
    isDev: env === 'development'
};
const envConfig = require(`./${env}.js`); // eslint-disable-line

base = _.merge(base, envConfig || {});

module.exports = base;