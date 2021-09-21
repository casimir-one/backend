import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { ContractAgreementService, ContractAgreementDtoService } from './../../services';
import { CONTRACT_AGREEMENT_STATUS } from './../../constants/';

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
    startTime,
    endTime,
    type,
    terms,
    proposalId
  } = event.getEventPayload();

  await contractAgreementService.createContractAgreement({
    contractAgreementId,
    creator,
    parties,
    hash,
    startTime,
    endTime,
    acceptedByParties: [],
    type,
    terms,
    status: CONTRACT_AGREEMENT_STATUS.PROPOSED,
    proposalId
  });
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
    startTime,
    endTime,
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
      startTime,
      endTime,
      acceptedByParties: [],
      type,
      terms,
      status: CONTRACT_AGREEMENT_STATUS.PENDING
    });
  }
});

contractAgreementEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_ACCEPTED, async (event) => {

  const { entityId: contractAgreementId, party } = event.getEventPayload();

  const contractAgreement = await contractAgreementDtoService.getContractAgreement(contractAgreementId);

  const updatedContractAgreement = await contractAgreementService.updateContractAgreement({
    _id: contractAgreementId,
    acceptedByParties: [...contractAgreement.acceptedByParties, party]
  });

  const isAllAccepted =  updatedContractAgreement.parties.every(p => updatedContractAgreement.acceptedByParties.includes(p));

  if (isAllAccepted) {
    await contractAgreementService.updateContractAgreement({
      _id: contractAgreementId,
      status: CONTRACT_AGREEMENT_STATUS.APPROVED
    });
  }
});

module.exports = contractAgreementEventHandler;