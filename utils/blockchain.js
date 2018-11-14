
import deipRpc from '@deip/deip-rpc-client';

export async function sendTransaction(tx) {
    const promise = new Promise((resolve) => {
        deipRpc.api.broadcastTransactionSynchronous(tx, function(err, result) {
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

export async function getBlock(blockNum) {
    return new Promise((resolve, reject) => {
        deipRpc.api.getBlock(blockNum, function(err, result) {
            if (err) {
                return reject(err)
            }
            resolve(result);
        });
    })
}

export async function getTransaction(trxId) {
    return new Promise((resolve, reject) => {
        deipRpc.api.getTransaction(trxId, function(err, result) {
            if (err) {
                return reject(err)
            }
            resolve(result);
        });
    })
}