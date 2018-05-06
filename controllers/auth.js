import UsersService from '../services/users.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcryptjs'
import config from './../config'


const signIn = async function(ctx) {
    console.log(ctx.request);
    let usersService = new UsersService()

    const data = ctx.request.body
    const userInfo = await usersService.getUserByUsername(data.username)
    console.log(userInfo);

    if (userInfo != null && userInfo.isApproved) {
        // if (!bcrypt.compareSync(data.password, userInfo.password)) {
        //     ctx.body = {
        //         success: false,
        //         info: 'Password wrong!'
        //     }
        // } else {
        const secret = config.jwtSecret;
        const token = jwt.sign({
            // email: userInfo.email,
            // id: userInfo.id,
            pubKey: userInfo.pubKey,
            username: userInfo.username,
            exp: Math.floor(Date.now() / 1000) + (180 * 60) // 3 hours
        }, secret)
        ctx.body = {
                success: true,
                token: token
            }
            // }
    } else {
        ctx.body = {
            success: false,
            info: userInfo != null ?
                `Please wait for "${userInfo.username}" to be approved. We will send notification to "${userInfo.email}"` : `User "${data.username}" does not exist!`
        }
    }
}

export default {
    signIn
}