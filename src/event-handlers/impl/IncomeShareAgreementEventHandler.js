import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { IncomeShareAgreementService, IncomeShareAgreementDtoService } from './../../services';
import { CONTRACT_AGREEMENT_STATUS } from './../../constants/';
import { CONTRACT_AGREEMENT_TYPE } from '@deip/constants';

class IncomeShareAgreementEventHandler extends BaseEventHandler {
  constructor() {
    super();
  }

}

const incomeShareAgreementEventHandler = new IncomeShareAgreementEventHandler();

const incomeShareAgreementService = new IncomeShareAgreementService();
const incomeShareAgreementDtoService = new IncomeShareAgreementDtoService();

incomeShareAgreementEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_PROPOSAL_CREATED, async (event) => {

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

  if (type === CONTRACT_AGREEMENT_TYPE.INCOME_SHARE_AGREEMENT) {
    await incomeShareAgreementService.createIncomeShareAgreement({
      incomeShareAgreementId: contractAgreementId,
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
  }

});

incomeShareAgreementEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_PROPOSAL_DECLINED, async (event) => {

  const { contractAgreementId, type } = event.getEventPayload();

  if (type === CONTRACT_AGREEMENT_TYPE.INCOME_SHARE_AGREEMENT) {
    await incomeShareAgreementService.updateIncomeShareAgreement({
      _id: contractAgreementId,
      status: CONTRACT_AGREEMENT_STATUS.REJECTED
    });
  }
});

incomeShareAgreementEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_CREATED, async (event) => {

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

  if (type === CONTRACT_AGREEMENT_TYPE.INCOME_SHARE_AGREEMENT) {
    const incomeShareAgreement = await incomeShareAgreementDtoService.getIncomeShareAgreement(contractAgreementId);
    if (incomeShareAgreement && incomeShareAgreement.status === CONTRACT_AGREEMENT_STATUS.PROPOSED) {
      await incomeShareAgreementService.updateIncomeShareAgreement({
        _id: contractAgreementId,
        status: CONTRACT_AGREEMENT_STATUS.PENDING
      });
    } else {
      await incomeShareAgreementService.createIncomeShareAgreement({
        incomeShareAgreementId: contractAgreementId,
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
  }
});

incomeShareAgreementEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_ACCEPTED, async (event) => {

  const { entityId: contractAgreementId, party } = event.getEventPayload();

  const incomeShareAgreement = await incomeShareAgreementDtoService.getIncomeShareAgreement(contractAgreementId);
  if (incomeShareAgreement) {
    const updatedIncomeShareAgreement = await incomeShareAgreementService.updateIncomeShareAgreement({
      _id: contractAgreementId,
      acceptedByParties: [...incomeShareAgreement.acceptedByParties, party]
    });
  
    const isAllAccepted =  updatedIncomeShareAgreement.parties.every(p => updatedIncomeShareAgreement.acceptedByParties.includes(p));
    if (isAllAccepted) {
      await incomeShareAgreementService.updateIncomeShareAgreement({
        _id: contractAgreementId,
        status: CONTRACT_AGREEMENT_STATUS.APPROVED
      });
    }
  }
});

module.exports = incomeShareAgreementEventHandler;