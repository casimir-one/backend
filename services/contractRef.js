import ContractRef from './../schemas/contractRef';

async function findContractRefById(_id) {
  const contractRef = await ContractRef.findOne({ _id });
  return contractRef;
};

async function createContractRef({
  templateRef,
  contractHash,
}) {

  const contractRef = new ContractRef({
    _id: contractHash,
    templateRef,
  });
  const savedRef = await contractRef.save();
  return savedRef;
}


export default {
  findContractRefById,
  createContractRef,
}
