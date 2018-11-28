module.exports = {
    mongo: {
        "deip-server": {
            connection: 'mongodb://deip:XTFEaoBKqYr@mongodb:27017/deip-server?authSource=admin',
        }
    },
    blockchain: {
        rpcEndpoint: "https://dev-full-node.deip.world",
        chainId: "2117b1fb8f3023d0f70dd5e12a675cd7fc042f4e179d0ce68a756ecf946e5095",
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