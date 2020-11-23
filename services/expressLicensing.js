import deipRpc from '@deip/rpc-client';
import ExpressLicense from './../schemas/expressLicense';
import { SMART_CONTRACT_TYPE } from '../constants';


class ExpressLicensingService {

  constructor(proposalsService, usersService, researchGroupService) {
    this.proposalsService = proposalsService;
    this.usersService = usersService;
    this.researchGroupService = researchGroupService;
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