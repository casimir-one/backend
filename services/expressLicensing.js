import deipRpc from '@deip/rpc-client';
import ExpressLicense from './../schemas/expressLicense';
import ExpressLicenseRequest from './../schemas/expressLicenseRequest';
import { EXPRESS_LICENSE_REQUEST_STATUS } from './../constants';


class ExpressLicensingService {

  constructor() {}

  async findExpressLicensingRequest(externalId) {
    let request = await ExpressLicenseRequest.findOne({ _id: externalId });
    return request.toObject();
  }

  async createExpressLicenseRequest({
    externalId,
    requester,
    researchExternalId,
    researchGroupExternalId,
    licencePlan,
    expirationDate,
    status,
    approvers,
    rejectors
  }) {

    const request = new ExpressLicenseRequest({
      _id: externalId,
      requester,
      researchExternalId,
      researchGroupExternalId,
      licencePlan,
      expirationDate,
      status,
      approvers,
      rejectors
    });

    const savedRequest = await request.save();
    return savedRequest.toObject();
  }


  async updateExpressLicensingRequest(externalId, { 
    status,
    approvers,
    rejectors
  }) {

    const request = await ExpressLicenseRequest.findOne({ _id: externalId });

    request.status = status ? status : request.status;
    request.approvers = approvers ? approvers : request.approvers;
    request.rejectors = rejectors ? rejectors : request.rejectors;

    const updatedRequest = await request.save();
    return updatedRequest.toObject();
  }


  async getExpressLicenseRequests() {
    const requests = await ExpressLicenseRequest.find({});
    return requests.map(r => r.toObject());
  }


  async getExpressLicenseRequestsByStatus(status) {
    const requests = await ExpressLicenseRequest.find({ status });
    return requests.map(r => r.toObject());
  }


  async getExpressLicenseRequestsByResearchGroups(researchGroupExternalIds) {
    const requests = await ExpressLicenseRequest.find({ researchGroupExternalId: { $in: researchGroupExternalIds } });
    return requests.map(r => r.toObject());
  }


  async getExpressLicenseRequestById(requestId) {
    const request = await ExpressLicenseRequest.findOne({ _id: requestId });
    return request.toObject();
  }

  
  async getExpressLicenseRequestsByResearch(researchExternalId) {
    const requests = await ExpressLicenseRequest.find({ researchExternalId });
    return requests.map(r => r.toObject());
  }


  async getExpressLicenseRequestsByRequester(requester) {
    const requests = await ExpressLicenseRequest.find({ requester });
    return requests.map(r => r.toObject());
  }


  async createExpressLicense({
    owner,
    requestId,
    researchExternalId,
    researchGroupExternalId,
    licencePlan
  }) {

    const license = new ExpressLicense({
      owner,
      requestId,
      researchExternalId,
      researchGroupExternalId,
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