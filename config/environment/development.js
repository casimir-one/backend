module.exports = {
    mongo: {
        "deip-server": {
            connection: 'mongodb://127.0.0.1:27017/deip-server-dev',
        }
    },
    blockchain: {
        rpcEndpoint: "http://127.0.0.1:8090",
        chainId: "9cb89c05145e1960d7bebecc5c4388007bb20bb72b91f572c3df8c6457587a68",
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