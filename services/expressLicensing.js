import ExpressLicense from './../schemas/expressLicense';
import BaseReadModelService from './base';
import deipRpc from '@deip/rpc-client';


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

  async getResearchLicense(externalId) {
    const license = await deipRpc.api.getResearchLicenseAsync(externalId);
    return license;
  }

  async getResearchLicensesByLicensee(licensee) {
    const licenses = await deipRpc.api.getResearchLicensesByLicenseeAsync(licensee);
    return licenses;
  }

  async getResearchLicensesByLicenser(licenser) {
    const licenses = await deipRpc.api.getResearchLicensesByLicenserAsync(licenser);
    return licenses;
  }

  async getResearchLicensesByResearch(researchId) {
    const licenses = await deipRpc.api.getResearchLicensesByResearchAsync(researchId);
    return licenses;
  }

  async getResearchLicensesByLicenseeAndResearch(licensee, researchId) {
    const licenses = await deipRpc.api.getResearchLicensesByLicenseeAndResearchAsync(licensee, researchId);
    return licenses;
  }

  async getResearchLicensesByLicenseeAndLicenser(licensee, licenser) {
    const licenses = await deipRpc.api.getResearchLicensesByLicenseeAndLicenserAsync(licensee, licenser);
    return licenses;
  }
}

export default ExpressLicensingService;