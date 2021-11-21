import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { ContractAgreementService, ContractAgreementDtoService } from './../../services';
import { APP_PROPOSAL, APP_CMD, CONTRACT_AGREEMENT_STATUS } from '@deip/constants';

class ContractAgreementEventHandler extends BaseEventHandler {
  constructor() {
    super();
  }

}

const contractAgreementEventHandler = new ContractAgreementEventHandler();
const contractAgreementDtoService = new ContractAgreementDtoService();

const contractAgreementService = new ContractAgreementService();

contractAgreementEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_PROPOSAL_CREATED, async (event) => {

  const {
    contractAgreementId,
    creator,
    parties,
    hash,
    activationTime,
    expirationTime,
    type,
    terms,
    proposalId
  } = event.getEventPayload();

  await contractAgreementService.createContractAgreement({
    contractAgreementId,
    creator,
    parties,
    hash,
    activationTime,
    expirationTime,
    acceptedByParties: [],
    signers: [],
    type,
    terms,
    status: CONTRACT_AGREEMENT_STATUS.PROPOSED,
    proposalId
  });
});

contractAgreementEventHandler.register(APP_EVENT.PROPOSAL_UPDATED, async (event) => {

  const { proposalCtx: { type: proposalType, proposedCmds }, approvals } = event.getEventPayload();

  if (proposalType === APP_PROPOSAL.CONTRACT_AGREEMENT_PROPOSAL) {
    const createContractAgreementCmd = proposedCmds.find(p => p.getCmdNum() === APP_CMD.CREATE_CONTRACT_AGREEMENT);
    const { entityId: contractAgreementId } = createContractAgreementCmd.getCmdPayload();
    const contractAgreement = await contractAgreementDtoService.getContractAgreement(contractAgreementId);
    for (const approvalId of approvals) {
      if (!contractAgreement.signers.some(s => s.id === approvalId)) {
        const date = new Date(Date.now());
        const updatedContractAgreement = await contractAgreementService.updateContractAgreement({
          _id: contractAgreementId,
          signers: [...contractAgreement.signers, {
            id: approvalId,
            date
          }]
        });
        contractAgreement.signers = updatedContractAgreement.signers;
      }
    }
  }
});

contractAgreementEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_PROPOSAL_DECLINED, async (event) => {

  const { contractAgreementId } = event.getEventPayload();

  await contractAgreementService.updateContractAgreement({
    _id: contractAgreementId,
    status: CONTRACT_AGREEMENT_STATUS.REJECTED
  });
});

contractAgreementEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_CREATED, async (event) => {

  const {
    entityId: contractAgreementId,
    creator,
    parties,
    hash,
    activationTime,
    expirationTime,
    type,
    terms
  } = event.getEventPayload();

  const contractAgreement = await contractAgreementDtoService.getContractAgreement(contractAgreementId);
  if (contractAgreement && contractAgreement.status === CONTRACT_AGREEMENT_STATUS.PROPOSED) {
    await contractAgreementService.updateContractAgreement({
      _id: contractAgreementId,
      status: CONTRACT_AGREEMENT_STATUS.PENDING
    });
  } else {
    await contractAgreementService.createContractAgreement({
      contractAgreementId,
      creator,
      parties,
      hash,
      activationTime,
      expirationTime,
      acceptedByParties: [],
      signers: [],
      type,
      terms,
      status: CONTRACT_AGREEMENT_STATUS.PENDING
    });
  }
});

contractAgreementEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_ACCEPTED, async (event) => {

  const { entityId: contractAgreementId, party } = event.getEventPayload();

  const contractAgreement = await contractAgreementDtoService.getContractAgreement(contractAgreementId);
  const updatedData = {
    _id: contractAgreementId,
    acceptedByParties: [...contractAgreement.acceptedByParties, party]
  }
  if (!contractAgreement.signers.some(s => s.id === party)) {
    const date = new Date(Date.now());
    updatedData.signers = [...contractAgreement.signers, {
      id: party,
      date
    }]
  }
  const updatedContractAgreement = await contractAgreementService.updateContractAgreement(updatedData);

  const isAllAccepted = updatedContractAgreement.parties.every(p => updatedContractAgreement.acceptedByParties.includes(p));

  if (isAllAccepted) {
    await contractAgreementService.updateContractAgreement({
      _id: contractAgreementId,
      status: CONTRACT_AGREEMENT_STATUS.APPROVED
    });
  }
});

module.exports = contractAgreementEventHandler;