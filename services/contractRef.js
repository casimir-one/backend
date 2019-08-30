import deipRpc from '@deip/deip-rpc-client';
import ContractRef from './../schemas/contractRef';

async function findContractRefById(_id) {
  const contractRef = await ContractRef.findOne({ _id });
  return contractRef;
}

async function findContractRefsByParty(value) {
  const contractsRefs = await ContractRef.find({
    $or: [
      { 'sender.email': value }, { 'sender.username': value },
      { 'receiver.email': value }, { 'receiver.username': value }]
  });
  return contractsRefs;
}

async function findContractRefsBySender(value) {
  const contractsRefs = await ContractRef.find({
    $or: [
      { 'sender.email': value }, { 'sender.username': value }]
  });
  return contractsRefs;
}

async function findContractRefsByReceiver(value) {
  const contractsRefs = await ContractRef.find({
    $or: [
      { 'receiver.email': value }, { 'receiver.username': value }]
  });
  return contractsRefs;
}

async function updateContractsRefsForRegisteredReceiver(email, {
  pubKey, username
}) {
  return ContractRef.update({ 'receiver.email': email }, {
    $set: {
      'receiver.pubKey': pubKey,
      'receiver.username': username,
      status: 'pending-sender-signature'
    }
  }, { multi: true })
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
    expirationDate: expirationDate
  });
  const savedRef = await contractRef.save();
  return savedRef;
}


export default {
  findContractRefById,
  findContractRefsByParty,
  findContractRefsBySender,
  findContractRefsByReceiver,
  updateContractsRefsForRegisteredReceiver,
  createContractRef
}