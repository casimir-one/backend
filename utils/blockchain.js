
import deipRpc from '@deip/rpc-client';

async function sendTransactionAsync(tx) {
  const promise = new Promise((resolve, reject) => {
    deipRpc.api.broadcastTransactionSynchronous(tx, function (err, result) {
      if (err) {
        console.log(err);
        reject(err)
      } else {
        resolve(result)
      }
    });
  });
  return promise;
}


// TODO: remove this
async function sendTransaction(tx) {
  const promise = new Promise((resolve) => {
    deipRpc.api.broadcastTransactionSynchronous(tx, function (err, result) {
      if (err) {
        console.log(err);
        resolve({ isSuccess: false, txInfo: null })
      } else {
        console.log(result);
        resolve({ isSuccess: true, txInfo: result })
      }
    });
  });
  return promise;
}

async function getBlock(blockNum) {
  return new Promise((resolve, reject) => {
    deipRpc.api.getBlock(blockNum, function (err, result) {
      if (err) {
        return reject(err)
      }
      resolve(result);
    });
  })
}

async function getTransaction(trxId) {
  return new Promise((resolve, reject) => {
    deipRpc.api.getTransaction(trxId, function (err, result) {
      if (err) {
        return reject(err)
      }
      resolve(result);
    });
  })
}

export {
  sendTransaction,
  getBlock,
  getTransaction,
  sendTransactionAsync
}