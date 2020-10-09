import deipRpc from '@deip/rpc-client';
import ExpressLicensingRequest from './../schemas/expressLicensingRequest';
import { EXPRESS_LICENSING_REQUEST_STATUS } from './../constants';
import mongoose from 'mongoose';


class ExpressLicensingService {

  constructor() {}

  async findExpressLicensingRequest(externalId) {
    let request = await ExpressLicensingRequest.findOne({ _id: externalId });
    return request.toObject();
  }

  async createExpressLicensingRequest({
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

    const request = new ExpressLicensingRequest({
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

    const request = await ExpressLicensingRequest.findOne({ _id: externalId });

    request.status = status ? status : request.status;
    request.approvers = approvers ? approvers : request.approvers;
    request.rejectors = rejectors ? rejectors : request.rejectors;

    const updatedRequest = await request.save();
    return updatedRequest.toObject();
  }


  async getExpressLicensingRequests() {
    const requests = await ExpressLicensingRequest.find({});
    return requests.map(r => r.toObject());
  }


  async getExpressLicensingRequestsByStatus(status) {
    const requests = await ExpressLicensingRequest.find({ status });
    return requests.map(r => r.toObject());
  }


  async getExpressLicensingRequestById(requestId) {
    const request = await ExpressLicensingRequest.findOne({ _id: requestId });
    return request.toObject();
  }

  
  async getExpressLicensingRequestsByResearch(researchExternalId) {
    const requests = await ExpressLicensingRequest.find({ researchExternalId });
    return requests.map(r => r.toObject());
  }


  async getExpressLicensingRequestsByRequester(requester) {
    const requests = await ExpressLicensingRequest.find({ requester });
    return requests.map(r => r.toObject());
  }

  
}

export default ExpressLicensingService;