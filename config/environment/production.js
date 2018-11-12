module.exports = {
    mongo: {
        "deip-server": {
            connection: 'mongodb://deip:XTFEaoBKqYr@mongodb:27017/deip-server?authSource=admin',
        }
    },
    blockchain: {
        rpcEndpoint: "https://dev-full-node.deip.world",
        chainId: "02775d4d51472e637b1552939195fa713112da42e0f25c16974ffc63aa02457f",
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