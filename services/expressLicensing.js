import deipRpc from '@deip/rpc-client';
import ExpressLicense from './../schemas/expressLicense';
import ExpressLicenseRequest from './../schemas/expressLicenseRequest';
import usersService from './../services/users';
import ResearchGroupService from './../services/researchGroup';
import { EXPRESS_LICENSE_REQUEST_STATUS } from './../constants';


class ExpressLicensingService {

  constructor() {
    this.usersService = usersService;
    this.researchGroupService = new ResearchGroupService();
  }

  async mapExpressLicenseRequests(requests) {

    const accounts = requests.reduce((acc, req) => {

      for (let i = 0; i < req.approvers.length; i++) {
        let approver = req.approvers[i];
        if (!acc.some(a => a == approver)) {
          acc.push(approver);
        }
      }

      for (let i = 0; i < req.rejectors.length; i++) {
        let rejector = req.rejectors[i];
        if (!acc.some(a => a == rejector)) {
          acc.push(rejector);
        }
      }

      if (!acc.some(a => a == req.requester)) {
        acc.push(req.requester);
      }

      if (!acc.some(a => a == req.researchGroupExternalId)) {
        acc.push(req.researchGroupExternalId);
      }

      return acc;
    }, []);

    const chainAccounts = await deipRpc.api.getAccountsAsync(accounts);
    
    const chainResearchGroupAccounts = chainAccounts.filter(a => a.is_research_group);
    const chainUserAccounts = chainAccounts.filter(a => !a.is_research_group);

    const researchGroups = await this.researchGroupService.getResearchGroups(chainResearchGroupAccounts.map(a => a.name))
    const users = await this.usersService.getUsers(chainUserAccounts.map(a => a.name));

    return requests.map((req) => {

      const extendedDetails = {

        approvers: req.approvers.map(a => {
          let userApprover = users.find(u => u.account.name == a);
          let researchGroupApprover = researchGroups.find(g => g.external_id == a);
          return userApprover ? userApprover : researchGroupApprover;
        }),

        rejectors: req.rejectors.map(a => {
          let userRejector = users.find(u => u.account.name == a);
          let researchGroupRejector = researchGroups.find(g => g.external_id == a);
          return userRejector ? userRejector : researchGroupRejector;
        }),

        requester: users.find(u => u.account.name == req.requester),

        researchGroup: researchGroups.find(g => g.external_id == req.researchGroupExternalId)
      }

      return { ...req.toObject(), extendedDetails };
    })

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
    rejectors,
    chainHistory
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
      rejectors,
      chainHistory
    });

    const savedRequest = await request.save();
    return savedRequest.toObject();
  }


  async updateExpressLicensingRequest(externalId, { 
    status,
    approvers,
    rejectors,
    chainHistory
  }) {

    const request = await ExpressLicenseRequest.findOne({ _id: externalId });

    request.status = status ? status : request.status;
    request.approvers = approvers ? approvers : request.approvers;
    request.rejectors = rejectors ? rejectors : request.rejectors;
    request.chainHistory = chainHistory ? chainHistory : request.chainHistory;

    const updatedRequest = await request.save();
    return updatedRequest.toObject();
  }


  async getExpressLicensingRequest(externalId) {
    let request = await ExpressLicenseRequest.findOne({ _id: externalId });
    let [result] = await this.mapExpressLicenseRequests([request])
    return result;
  }

  async getExpressLicenseRequests() {
    const requests = await ExpressLicenseRequest.find({});
    const result = await this.mapExpressLicenseRequests(requests)
    return result;
  }


  async getExpressLicenseRequestsByStatus(status) {
    const requests = await ExpressLicenseRequest.find({ status });
    const result = await this.mapExpressLicenseRequests(requests)
    return result;
  }


  async getExpressLicenseRequestsByResearchGroups(researchGroupExternalIds) {
    const requests = await ExpressLicenseRequest.find({ researchGroupExternalId: { $in: researchGroupExternalIds } });
    const result = await this.mapExpressLicenseRequests(requests)
    return result;  
  }


  async getExpressLicenseRequestById(requestId) {
    const request = await ExpressLicenseRequest.findOne({ _id: requestId });
    const [result] = await this.mapExpressLicenseRequests([request])
    return result;
  }

  
  async getExpressLicenseRequestsByResearch(researchExternalId) {
    const requests = await ExpressLicenseRequest.find({ researchExternalId });
    const result = await this.mapExpressLicenseRequests(requests)
    return result;  
  }


  async getExpressLicenseRequestsByRequester(requester) {
    const requests = await ExpressLicenseRequest.find({ requester });
    const result = await this.mapExpressLicenseRequests(requests)
    return result;  
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