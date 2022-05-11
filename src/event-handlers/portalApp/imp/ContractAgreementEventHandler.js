import { APP_CMD, APP_EVENT, APP_PROPOSAL, CONTRACT_AGREEMENT_STATUS } from '@deip/constants';
import { ContractAgreementDtoService, ContractAgreementService } from '../../../services';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';

class ContractAgreementEventHandler extends PortalAppEventHandler {
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

contractAgreementEventHandler.register(APP_EVENT.PROPOSAL_ACCEPTED, async (event) => {

  const { proposalCtx: { type: proposalType, proposedCmds }, account } = event.getEventPayload();

  if (proposalType === APP_PROPOSAL.CONTRACT_AGREEMENT_PROPOSAL) {
    const createContractAgreementCmd = proposedCmds.find(p => p.getCmdNum() === APP_CMD.CREATE_CONTRACT_AGREEMENT);
    const { entityId: contractAgreementId } = createContractAgreementCmd.getCmdPayload();

    const contractAgreement = await contractAgreementDtoService.getContractAgreement(contractAgreementId);
    if (!contractAgreement.signers.some(s => s.id === account)) {
      const date = new Date().getTime();
      const updatedContractAgreement = await contractAgreementService.updateContractAgreement({
        _id: contractAgreementId,
        signers: [...contractAgreement.signers, {
          id: account,
          date
        }]
      });
      contractAgreement.signers = updatedContractAgreement.signers;
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
    const date = new Date().getTime();
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

contractAgreementEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_REJECTED, async (event) => {

  const { entityId: contractAgreementId, party } = event.getEventPayload();

  await contractAgreementService.updateContractAgreement({
    _id: contractAgreementId,
    status: CONTRACT_AGREEMENT_STATUS.REJECTED
  });
});

module.exports = contractAgreementEventHandler;