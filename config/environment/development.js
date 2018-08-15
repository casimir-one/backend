module.exports = {
    mongo: {
        "deip-server": {
            connection: 'mongodb://127.0.0.1:27017/deip-server-dev',
        }
    },
    blockchain: {
        rpcEndpoint: "https://dev-full-node.deip.world/",
        chainId: "9c90084a1527c5ca3e111213ff27a8e79fc7488052b5ce8d73a9a5cc2164081f"
    },
    host: 'http://localhost:8081',
    sigSeed: "quickbrownfoxjumpsoverthelazydog",
    jwtSecret: 'shhhhhhhhhhh!!!'
};