import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import config from './../config'
import deipRpc from '@deip/deip-rpc';
import crypto from '@deip/libcrypto';
import { TextEncoder } from 'util';

function Encodeuint8arr(seed) {
    return new TextEncoder("utf-8").encode(seed);
}

const signIn = async function(ctx) {
    const data = ctx.request.body;
    const username = data.username;
    const secretSigHex = data.secretSigHex;
    console.log("before 'deipRpc.api.getAccountsAsync' call")
    let accounts = await deipRpc.api.getAccountsAsync([username])
    console.log("after 'deipRpc.api.getAccountsAsync' call")

    if (accounts[0]) {
        const pubWif = accounts[0].owner.key_auths[0][0]
        console.log(pubWif)

        console.log("before 'crypto.PublicKey.from' call")
        const publicKey = crypto.PublicKey.from(pubWif);
        console.log("after 'crypto.PublicKey.from' call")

        var isValid;
        try {
            // sigSeed should be uint8 array with length = 32
            console.log("before 'publicKey.verify' call")
            isValid = publicKey.verify(
                Encodeuint8arr(config.sigSeed).buffer,
                crypto.unhexify(secretSigHex).buffer);
            console.log("after 'publicKey.verify' call")
        } catch (err) {
            console.log("catch 'publicKey.verify' call")
            isValid = false;
        }

        if (isValid) {
            const jwtSecret = config.jwtSecret;
            console.log("before 'jwtToken.sign' call")
            const jwtToken = jwt.sign({
                pubKey: pubWif,
                username: username,
                exp: Math.floor(Date.now() / 1000) + (180 * 60) // 3 hours
            }, jwtSecret)
            console.log("after 'jwtToken.sign' call")

            ctx.body = {
                success: true,
                jwtToken: jwtToken
            }

        } else {
            console.log("before Signature is invalid ....")

            ctx.body = {
                success: false,
                error: `Signature is invalid for ${username}, make sure you specify correct private key`
            }
        }

    } else {
        console.log("User does not exist....")

        ctx.body = {
            success: false,
            error: `User "${username}" does not exist!`
        }
    }
}


export default {
    signIn
}