import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import config from './../config'
import deipRpc from '@deip/deip-rpc-client';
import crypto from '@deip/lib-crypto';
import { TextEncoder } from 'util';

function Encodeuint8arr(seed) {
    return new TextEncoder("utf-8").encode(seed);
}

const signIn = async function(ctx) {
    const data = ctx.request.body;
    const username = data.username;
    const secretSigHex = data.secretSigHex;
    let accounts = await deipRpc.api.getAccountsAsync([username])

    if (accounts[0]) {
        const pubWif = accounts[0].owner.key_auths[0][0]
        const publicKey = crypto.PublicKey.from(pubWif);

        var isValid;
        try {
            // sigSeed should be uint8 array with length = 32
            isValid = publicKey.verify(
                Encodeuint8arr(config.sigSeed).buffer,
                crypto.unhexify(secretSigHex).buffer);
        } catch (err) {
            isValid = false;
        }

        if (isValid) {
            const jwtSecret = config.jwtSecret;
            const jwtToken = jwt.sign({
                pubKey: pubWif,
                username: username,
                exp: Math.floor(Date.now() / 1000) + (180 * 60) // 3 hours
            }, jwtSecret)

            ctx.body = {
                success: true,
                jwtToken: jwtToken
            }

        } else {

            ctx.body = {
                success: false,
                error: `Signature is invalid for ${username}, make sure you specify correct private key`
            }
        }

    } else {
        ctx.body = {
            success: false,
            error: `User "${username}" does not exist!`
        }
    }
}


export default {
    signIn
}