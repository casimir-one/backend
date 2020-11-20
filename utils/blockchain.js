
import deipRpc from '@deip/rpc-client';


async function signOperations(operations, ownerKey) {
  return new Promise((resolve, reject) => {
    deipRpc.api.getDynamicGlobalProperties((err, result) => {
      if (!err) {
        const BlockNum = (result.last_irreversible_block_num - 1) & 0xFFFF;
        deipRpc.api.getBlockHeader(result.last_irreversible_block_num, (e, res) => {
          // TODO: switch to Buffer.from()
          const BlockPrefix = new Buffer(res.previous, 'hex').readUInt32LE(4);
          const nowPlus1Hour = new Date().getTime() + 3e6;
          const expire = new Date(nowPlus1Hour).toISOString().split('.')[0];

          const unsignedTX = {
            expiration: expire,
            extensions: [],
            operations: operations,
            ref_block_num: BlockNum,
            ref_block_prefix: BlockPrefix
          };

          try {
            const signedTX = deipRpc.auth.signTransaction(unsignedTX, { owner: ownerKey });
            resolve(signedTX);
          } catch (err) {
            reject(err);
          }
        });
      }
    });
  });
}

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


function extractOperations(tx) {
  const result = [];

  for (let i = 0; i < tx.operations.length; i++) {
    let [op_name, op_payload] = tx.operations[i];

    result.push([op_name, op_payload, null]);

    if (op_name === 'create_proposal') {
      extractOperationsFromProposal(op_payload, result);
    }
  }

  return result;
}

function extractOperationsFromProposal(proposal, result) {

  for (let i = 0; i < proposal.proposed_ops.length; i++) {
    let [op_name, op_payload] = proposal.proposed_ops[i]['op'];
    result.push([op_name, op_payload, proposal]);

    if (op_name === 'create_proposal') {
      extractOperationsFromProposal(op_payload, result);
    }
  }
}

export {
  sendTransaction,
  getBlock,
  getTransaction,
  sendTransactionAsync,
  signOperations,
  extractOperations
}