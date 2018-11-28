module.exports = {
    mongo: {
        "deip-server": {
            connection: 'mongodb://127.0.0.1:27017/deip-server-dev',
        }
    },
    blockchain: {
        rpcEndpoint: "http://127.0.0.1:8090",
        chainId: "2117b1fb8f3023d0f70dd5e12a675cd7fc042f4e179d0ce68a756ecf946e5095",
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