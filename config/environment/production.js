module.exports = {
    mongo: {
        "deip-server": {
            connection: 'mongodb://deip:XTFEaoBKqYr@mongodb:27017/deip-server?authSource=admin',
        }
    },
    blockchain: {
        rpcEndpoint: "https://dev-full-node.deip.world",
        chainId: "9cb89c05145e1960d7bebecc5c4388007bb20bb72b91f572c3df8c6457587a68",
        accountsCreator : {
            username: "alice",
            wif: "5JGoCjh27sfuCzp7kQme5yMipaQtgdVLPiZPr9zaCwJVrSrbGYx",
            fee: "1.000 TESTS"
        }
    },
    host: 'https://dev-server.deip.world',
    uiHost: 'beta.deip.world',
    sigSeed: "quickbrownfoxjumpsoverthelazydog",
    jwtSecret: 'shhhhhhhhhhh!!!'
};