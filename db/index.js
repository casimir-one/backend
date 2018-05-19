const config = require('./../config');
const server_db = require('@paralect/mongo-node8').connect(config.mongo['deip-server'].connection);

module.exports = {
    server_db
}