import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import config from './../config';
import deipRpc from '@deip/deip-rpc-client';
import crypto from '@deip/lib-crypto';
import { TextEncoder } from 'util';
import UserProfile from './../schemas/user';

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

const signUp = async function(ctx) {
    const data = ctx.request.body;
    const username = data.username;
    const email = data.email;
    const firstName = data.firstName;
    const lastName = data.lastName;
    const pubKey = data.pubKey;

    if (!username || !pubKey || !email || !firstName || !/^[a-z][a-z0-9\-]+[a-z0-9]$/.test(username)) {
        ctx.status = 400;
        ctx.body = `'username', 'pubKey', 'email', 'firstName' fields are required`;
        return;
    }

    try {

        const accounts = await deipRpc.api.getAccountsAsync([username])
        if (accounts[0]) {
            ctx.status = 409;
            ctx.body = `Account '${username}' already exists`;
            return;
        }
    
        const owner = {
            weight_threshold: 1,
            account_auths: [],
            key_auths: [[pubKey, 1]]
        };
    
        const result = await createAccount(username, pubKey, owner);
        if (!result.isSuccess) {
            ctx.status = 500;
            ctx.body = result.result;
            return;
        }

        let profile = await UserProfile.findOne({'_id': username});
        if (!profile) {
            const model = new UserProfile({
                _id: username,
                email: email,
                firstName: firstName,
                lastName: lastName,
            });
            profile = await model.save();
        }
        
        ctx.status = 200;
        ctx.body = profile;

    } catch (err) {
        console.error(err);
        ctx.status = 500;
        ctx.body = err;
    }
}


async function createAccount(username, pubKey, owner) {
    const accountsCreator = config.blockchain.accountsCreator;

    let promise = new Promise((resolve) => {
        deipRpc.api.getConfig((err, chainConfig) => {
            if (err) {
                console.log(err, chainConfig);
                resolve({isSuccess:false, result: err})
            }

            deipRpc.api.getChainProperties((err, chainProps) => {
                if (err) {
                    console.log(err, chainProps);
                    resolve({isSuccess:false, result: err})
                }

                // const ratio = chainConfig['DEIP_CREATE_ACCOUNT_DELEGATION_RATIO'];
                // var fee = Asset.from(chainProps.account_creation_fee).multiply(ratio);
                const jsonMetadata = '';
                deipRpc.broadcast.accountCreate(accountsCreator.wif, accountsCreator.fee, 
                            accountsCreator.username, username, owner, owner, owner, 
                            pubKey, jsonMetadata, (err, result) => {

                    if (err) {
                        console.log(err, chainProps);
                        resolve({isSuccess:false, result: err})
                    }
                    resolve({isSuccess:true, result: result})
                });
            });
        });
    });
    return await promise;
}


export default {
    signIn,
    signUp
}