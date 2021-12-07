import BaseService from './../../base/BaseService';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import ContractAgreementSchema from './../../../schemas/ContractAgreementSchema';

class ContractAgreementDtoService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ContractAgreementSchema, options);
  }

  async mapContractAgreements(agreements) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const chainAgreements = await Promise.all(agreements.map(agreement => chainRpc.getContractAgreementAsync(agreement._id)));
    
    return agreements.map((agreement) => {
      const chainAgreement = chainAgreements.find((chainAgreement) => chainAgreement && chainAgreement.agreementId == agreement._id);
      if (!chainAgreement) {
        console.warn(`Contract agreement with ID '${agreement._id}' is not found in the Chain`);
      }

      return {
        _id: agreement._id,
        tenantId: agreement.tenantId,
        status: agreement.status,
        creator: agreement.creator,
        parties: agreement.parties,
        hash: agreement.hash,
        activationTime: agreement.activationTime,
        expirationTime: agreement.expirationTime,
        acceptedByParties: agreement.acceptedByParties,
        proposalId: agreement.proposalId,
        signers: agreement.signers,
        type: agreement.type,
        terms: agreement.terms,
        createdAt: agreement.createdAt || agreement.created_at,
        updatedAt: agreement.updatedAt || agreement.updated_at,

        // @deprecated
        chainContract: chainAgreement || null
      };
    });

  }

  async getContractAgreement(id) {
    const contractAgreement = await this.findOne({ _id: id });
    if (!contractAgreement) return null;
    const result = await this.mapContractAgreements([contractAgreement]);
    return result[0];
  }

  async getContractAgreements({
    parties,
    type,
    status,
    creator
  } = {}) {
    const query = {};
    if (type) query.type = type;
    if (status) query.status = status;
    if (creator) query.creator = creator;
    if (Array.isArray(parties) && parties.length) query.parties = { $all : [...parties] };
    const contractAgreements = await this.findMany(query);
    const result = await this.mapContractAgreements(contractAgreements);
    return result;
  }
}

export default ContractAgreementDtoService;