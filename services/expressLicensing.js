import ExpressLicense from './../schemas/expressLicense';
import BaseReadModelService from './base';


class ExpressLicensingService extends BaseReadModelService {

  constructor() {
    super(ExpressLicense);
  }

  async createExpressLicense({
    externalId,
    owner,
    requestId,
    researchExternalId,
    licencePlan
  }) {

    const result = await this.createOne({
      _id: externalId,
      owner,
      requestId,
      researchExternalId,
      licencePlan
    });

    return result;
  }


  async getExpressLicensesByOwner(owner) {
    const result = await this.findMany({ owner });
    return result;
  }


  async getExpressLicensesByResearches(researchExternalIds) {
    const result = await this.findMany({ researchExternalId: { $in: researchExternalIds } });
    return result;
  }


  async getExpressLicensesByResearch(researchExternalId) {
    const result = await this.findMany({ researchExternalId });
    return result;
  }


  async getExpressLicenseByRequest(requestId) {
    const result = await this.findOne({ requestId });
    return result;
  }


  async getExpressLicense(id) {
    const result = await this.findOne({ _id: id });
    return result;
  }

  
}

export default ExpressLicensingService;