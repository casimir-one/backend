
import deipRpc from '@deip/deip-rpc-client';

export async function sendTransaction(tx) {
    const promise = new Promise((resolve) => {
        deipRpc.api.broadcastTransactionSynchronous(tx, function(err, result) {
            if (err) {
                console.log(err);
                resolve({isSuccess:false})
            } else {
                console.log(result);
                resolve({isSuccess:true})
            }
        });
    });
    return promise;
}
