
import deipRpc from '@deip/rpc-client';
import config from './../config';
import request from 'request';
import util from 'util';

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
            extensions: [[
              "tenant_marker",
              {
                tenant: config.TENANT,
                extensions: []
              }
            ]],
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

// temporary solution until we unite all tenants into global network
async function usernameExistsInGlobalNetwork(username, tenant) {
  const requestPromise = util.promisify(request);
  const endpoints = tenant && tenant.network && tenant.network.nodes ? tenant.network.nodes : [];

  if (!endpoints.some(endpoint => endpoint == config.blockchain.rpcEndpoint)) {
    endpoints.push(config.blockchain.rpcEndpoint);
  }

  const promises = [];
  for (let i = 0; i < endpoints.length; i++) {
    let endpoint = endpoints[i];
    const options = {
      url: endpoint,
      method: "post",
      headers: {
        "content-type": "text/plain"
      },
      body: JSON.stringify({ "jsonrpc": "2.0", "method": "get_accounts", "params": [[username]], "id": 1 })
    };

    promises.push(
      requestPromise(options)
        .then((res) => {
          return res;
        })
        .catch((err) => {
          return { error: "Request failed", body: '{}' };
        })
    )
  }

  const results = await Promise.all(promises);

  const usernames = results
    .reduce((acc, { error, body }) => {
      if (error) return acc;
      const bodyJson = JSON.parse(body);
      const usernames = bodyJson.result.filter(a => a != null).map(a => a.name);
      return [...acc, ...usernames];
    }, []);

  const exists = usernames.some(name => name == username);
  return exists;
}

export {
  sendTransaction,
  getBlock,
  getTransaction,
  sendTransactionAsync,
  signOperations,
  extractOperations,
  usernameExistsInGlobalNetwork
}