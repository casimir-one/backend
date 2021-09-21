
import { ChainService } from '@deip/chain-service';
import config from './../config';

async function signOperations(operations, privKey, refBlock = {}) {
  const { refBlockNum, refBlockPrefix } = refBlock;
  const chainService = await ChainService.getInstanceAsync(config);
  const chainNodeClient = chainService.getChainNodeClient();
  const deipRpc = chainNodeClient;

  const refBlockPromise = refBlockNum && refBlockPrefix
    ? Promise.resolve({ refBlockNum, refBlockPrefix })
    : getRefBlockSummary();

  return refBlockPromise
    .then(({ refBlockNum, refBlockPrefix }) => {
      const nowPlus1Hour = new Date().getTime() + 3e6;
      const expire = new Date(nowPlus1Hour).toISOString().split('.')[0];

      const tx = {
        expiration: expire,
        extensions: [],
        operations: operations,
        ref_block_num: refBlockNum,
        ref_block_prefix: refBlockPrefix
      };

      const signedTx = deipRpc.auth.signTransaction(tx, { owner: privKey }, { tenant: config.TENANT, tenantPrivKey: config.TENANT_PRIV_KEY });
      return signedTx;
    })
}

async function getRefBlockSummary() {
  let refBlockNum;
  let refBlockPrefix;

  const chainService = await ChainService.getInstanceAsync(config);
  const chainNodeClient = chainService.getChainNodeClient();
  const deipRpc = chainNodeClient;

  return deipRpc.api.getDynamicGlobalPropertiesAsync()
    .then((res, err) => {
      if (err) throw new Error(err);
      refBlockNum = (res.last_irreversible_block_num - 1) & 0xFFFF;
      return deipRpc.api.getBlockHeaderAsync(res.last_irreversible_block_num);
    })
    .then((res, err) => {
      if (err) throw new Error(err);
      refBlockPrefix = new Buffer(res.previous, 'hex').readUInt32LE(4);
      return { refBlockNum, refBlockPrefix };
    })
}

async function sendTransactionAsync(tx) {
  const chainService = await ChainService.getInstanceAsync(config);
  const chainNodeClient = chainService.getChainNodeClient();
  const deipRpc = chainNodeClient;

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


async function getBlock(blockNum) {
  const chainService = await ChainService.getInstanceAsync(config);
  const chainNodeClient = chainService.getChainNodeClient();
  const deipRpc = chainNodeClient;

  return new Promise((resolve, reject) => {
    deipRpc.api.getBlock(blockNum, function (err, result) {
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
  getBlock,
  getRefBlockSummary,
  sendTransactionAsync,
  signOperations,
  extractOperations
}