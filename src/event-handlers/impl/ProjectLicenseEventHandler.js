import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { ProjectLicensingService, ProjectLicensingDtoService } from './../../services';
import { CONTRACT_AGREEMENT_STATUS } from './../../constants/';
import { CONTRACT_AGREEMENT_TYPE } from '@deip/constants';

class ProjectLicenseEventHandler extends BaseEventHandler {
  constructor() {
    super();
  }
}

const projectLicenseEventHandler = new ProjectLicenseEventHandler();

const projectLicensingService = new ProjectLicensingService();
const projectLicensingDtoService = new ProjectLicensingDtoService();

projectLicenseEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_PROPOSAL_CREATED, async (event) => {

  const {
    contractAgreementId,
    proposalId,
    creator,
    terms,
    type,
    parties,
    hash,
    startTime,
    endTime
  } = event.getEventPayload();

  if (type === CONTRACT_AGREEMENT_TYPE.PROJECT_LICENSE) {
    await projectLicensingService.createProjectLicense({
      licenseId: contractAgreementId,
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

projectLicenseEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_PROPOSAL_DECLINED, async (event) => {

  const { contractAgreementId, type } = event.getEventPayload();

  if (type === CONTRACT_AGREEMENT_TYPE.PROJECT_LICENSE) {
    await projectLicensingService.updateProjectLicense({
      _id: contractAgreementId,
      status: CONTRACT_AGREEMENT_STATUS.REJECTED
    });
  }
});

projectLicenseEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_CREATED, async (event) => {

  const {
    entityId: contractAgreementId,
    creator,
    terms,
    type,
    parties,
    hash,
    startTime,
    endTime
  } = event.getEventPayload();

  if (type === CONTRACT_AGREEMENT_TYPE.PROJECT_LICENSE) {
    const license = await projectLicensingDtoService.getProjectLicense(contractAgreementId);
    if (license && license.status === CONTRACT_AGREEMENT_STATUS.PROPOSED) {
      await projectLicensingService.updateProjectLicense({
        _id: contractAgreementId,
        status: CONTRACT_AGREEMENT_STATUS.PENDING
      });
    } else {
      await projectLicensingService.createProjectLicense({
        licenseId: contractAgreementId,
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

projectLicenseEventHandler.register(APP_EVENT.CONTRACT_AGREEMENT_ACCEPTED, async (event) => {

  const { entityId: contractAgreementId, party } = event.getEventPayload();

  const license = await projectLicensingDtoService.getProjectLicense(contractAgreementId);
  if (license) {
    const updatedLicense = await projectLicensingService.updateProjectLicense({
      _id: contractAgreementId,
      acceptedByParties: [...license.acceptedByParties, party]
    });
  
    const isAllAccepted =  updatedLicense.parties.every(p => updatedLicense.acceptedByParties.includes(p));
    if (isAllAccepted) {
      await projectLicensingService.updateProjectLicense({
        _id: contractAgreementId,
        status: CONTRACT_AGREEMENT_STATUS.APPROVED
      });
    }
  }
});

module.exports = projectLicenseEventHandler;