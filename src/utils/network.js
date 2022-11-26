import config from './../config';

const waitChainBlockAsync = async (cbAsync = async () => { }, timeout = config.CHAIN_BLOCK_INTERVAL_MILLIS) => {
  await new Promise((resolve, reject) => {
    setTimeout(async () => {
      try {
        await cbAsync()
        resolve();
      } catch (err) {
        reject(err);
      }
    }, timeout);
  });
}


export {
  waitChainBlockAsync
}