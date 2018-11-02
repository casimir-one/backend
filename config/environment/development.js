module.exports = {
    mongo: {
        "deip-server": {
            connection: 'mongodb://127.0.0.1:27017/deip-server-dev',
        }
    },
    blockchain: {
        rpcEndpoint: "http://127.0.0.1:8090",
        chainId: "04ac2e56f7d9738a6742eec9f7f014db30a61276cf1cf89add3fb4a140fba1d1"
    },
    host: 'http://127.0.0.1:8081',
    sigSeed: "quickbrownfoxjumpsoverthelazydog",
    jwtSecret: 'shhhhhhhhhhh!!!'
};