import { createVerificationToken } from './../services/verificationTokens';
import config from './../config';

const postVerificationToken = async function (ctx) {
  const jwtUsername = ctx.state.user.username;
  const data = ctx.request.body;

  try {
    let sudoUser = config.sudoUsers.find(u => u == jwtUsername);
    if (!sudoUser) {
      ctx.status = 401;
      ctx.body = `You don't have access to the action`
      return;
    }

    let savedToken = await createVerificationToken(jwtUsername, data);
    ctx.status = 200;
    ctx.body = savedToken;
 
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
}

export default {
  postVerificationToken
}