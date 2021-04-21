const getUserTransactions = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const status = ctx.params.status;

  try {

    let result = [];
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


export default {
  getUserTransactions
}