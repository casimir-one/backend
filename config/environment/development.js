module.exports = {
    mongo: {
        "deip-server": {
            connection: 'mongodb://127.0.0.1:27017/deip-server-dev',
        }
    },
    blockchain: {
        rpcEndpoint: "http://127.0.0.1:8090",
        chainId: "04ac2e56f7d9738a6742eec9f7f014db30a61276cf1cf89add3fb4a140fba1d1",
        accountsCreator : {
            username: "alice",
            wif: "5JGoCjh27sfuCzp7kQme5yMipaQtgdVLPiZPr9zaCwJVrSrbGYx",
            fee: "1.000 TESTS"
        }
    },
    host: 'http://127.0.0.1:8081',
    uiHost: 'localhost:8080',
    sigSeed: "quickbrownfoxjumpsoverthelazydog",
    jwtSecret: 'shhhhhhhhhhh!!!'
};