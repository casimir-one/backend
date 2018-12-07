module.exports = {
    mongo: {
        "deip-server": {
            connection: 'mongodb://deip:XTFEaoBKqYr@mongodb:27017/deip-server?authSource=admin',
        }
    },
    blockchain: {
        rpcEndpoint: "https://test-dev-full-node.deip.world",
        chainId: "687d443b4cd4c1198b6f6a9bdfb29f7ca974695d69b515f24fc3db4fce5bebc9",
        accountsCreator : {
            username: "alice",
            wif: "5JGoCjh27sfuCzp7kQme5yMipaQtgdVLPiZPr9zaCwJVrSrbGYx",
            fee: "1.000 TESTS"
        }
    },
    host: 'https://test-dev-server.deip.world',
    uiHost: 'test-client.deip.world',
    sigSeed: "quickbrownfoxjumpsoverthelazydog",
    jwtSecret: 'shhhhhhhhhhh!!!'
};