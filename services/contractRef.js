import deipRpc from '@deip/deip-rpc-client';
import ContractRef from './../schemas/contractRef';

async function findContractRefById(_id) {
  const contractRef = await ContractRef.findOne({ _id });
  return contractRef;
}

async function findContractRefsByUsernameOrEmail(value) {
  const contractsRefs = await ContractRef.find({ $or: [
    { 'sender.email': value }, { 'sender.username': value }, 
    { 'receiver.email': value }, { 'receiver.username': value }
  ]
});
  return contractsRefs;
}

async function createContractRef({
  templateRef,
  sender: {
    email: senderEmail,
    pubKey: senderPubKey,
    username: senderUsername
  },
  receiver: {
    email: receiverEmail,
    pubKey: receiverPubKey,
    username: receiverUsername
  },
  status,
  hash,
  files,
  expirationDate
}) {

  const contractRef = new ContractRef({
    templateRef: templateRef,
    sender: {
      email: senderEmail,
      pubKey: senderPubKey,
      username: senderUsername
    },
    receiver: {
      email: receiverEmail,
      pubKey: receiverPubKey,
      username: receiverUsername
    },
    status: status,
    hash: hash,
    files: files,
    expirationDate: expirationDate
  });
  const savedRef = await contractRef.save();
  return savedRef;
}


export default {
  findContractRefById,
  findContractRefsByUsernameOrEmail,
  createContractRef
}