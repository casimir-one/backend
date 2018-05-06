const config = require('./../config');
const foundation_db = require('@paralect/mongo-node8').connect(config.mongo['deip-foundation'].connection);
const server_db = require('@paralect/mongo-node8').connect(config.mongo['deip-server'].connection);

module.exports = {
    foundation_db,
    server_db
}