import deipRpc from '@deip/rpc-client';
import ExpressLicense from './../schemas/expressLicense';
import ExpressLicenseRequest from './../schemas/expressLicenseRequest';
import { SMART_CONTRACT_TYPE } from '../constants';


class ExpressLicensingService {

  constructor(proposalsService, usersService, researchGroupService) {
    this.proposalsService = proposalsService;
    this.usersService = usersService;
    this.researchGroupService = researchGroupService;
  }

  async createExpressLicenseRequest(proposalId, {
    requester,
    researchExternalId,
    licenseExternalId,
    licencePlan
  }) {

    // const expressLicenseRequest = new ExpressLicenseRequest({
    //   _id: proposalId,
    //   requester,
    //   researchExternalId,
    //   licenseExternalId,
    //   licencePlan
    // });

    const proposalRef = await this.proposalsService.createProposalRef(proposalId, {
      type: SMART_CONTRACT_TYPE.EXPRESS_LICENSE_REQUEST,
      details: {
        _id: proposalId,
        requester,
        researchExternalId,
        licenseExternalId,
        licencePlan
      }
    });

    return proposalRef;
  }


  async getExpressLicensingRequest(externalId) {
    let request = await this.proposalsService.getProposalRef(externalId);
    let [result] = await this.proposalsService.extendExpressLicenseRequests([request])
    return result;
  } 


  async getExpressLicenseRequests() {
    const requests = this.proposalsService.getProposalRefsByType(SMART_CONTRACT_TYPE.EXPRESS_LICENSE_REQUEST);
    const result = await this.proposalsService.extendExpressLicenseRequests(requests)
    return result;
  }


  async getExpressLicenseRequestById(requestId) {
    const request = await this.proposalsService.getProposalRef(requestId);
    const [result] = await this.proposalsService.extendExpressLicenseRequests([request])
    return result;
  }


  async getExpressLicenseRequestsByResearch(researchExternalId) {
    const allRequests = this.proposalsService.getProposalRefsByType(SMART_CONTRACT_TYPE.EXPRESS_LICENSE_REQUEST);
    const requests = allRequests.filter(r => r.details.researchExternalId == researchExternalId)
    const result = await this.proposalsService.extendExpressLicenseRequests(requests)
    return result;  
  }


  async getExpressLicenseRequestsByRequester(requester) {
    const allRequests = this.proposalsService.getProposalRefsByType(SMART_CONTRACT_TYPE.EXPRESS_LICENSE_REQUEST);
    const requests = allRequests.filter(r => r.details.requester == requester)
    const result = await this.proposalsService.extendExpressLicenseRequests(requests)
    return result;  
  }


  async createExpressLicense({
    externalId,
    owner,
    requestId,
    researchExternalId,
    licencePlan
  }) {

    const license = new ExpressLicense({
      _id: externalId,
      owner,
      requestId,
      researchExternalId,
      licencePlan
    });

    const savedLicense = await license.save();
    return savedLicense.toObject();
  }


  async getExpressLicensesByOwner(owner) {
    const licenses = await ExpressLicense.find({ owner });
    return licenses.map(l => l.toObject());
  }


  async getExpressLicensesByResearches(researchExternalIds) {
    const licenses = await ExpressLicense.find({ researchExternalId: { $in: researchExternalIds } });
    return licenses.map(l => l.toObject());
  }


  async getExpressLicensesByResearch(researchExternalId) {
    const licenses = await ExpressLicense.find({ researchExternalId });
    return licenses.map(l => l.toObject());
  }


  async getExpressLicensesByRequestId(requestId) {
    const license = await ExpressLicense.findOne({ requestId });
    return license.toObject();
  }


  async getExpressLicensesById(_id) {
    const license = await ExpressLicense.findOne({ _id });
    return license.toObject();
  }

}

export default ExpressLicensingService;