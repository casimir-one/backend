import ExpressLicense from './../schemas/expressLicense';
import BaseService from './base/BaseService';
import deipRpc from '@deip/rpc-client';


class ExpressLicensingService extends BaseService {

  constructor(options = { scoped: true }) {
    super(ExpressLicense, options);
  }

  async mapExpressLicenses(expressLicenses) {
    const researchLicenses = await deipRpc.api.getResearchLicensesAsync(expressLicenses.map(l => l._id));
    return researchLicenses
      .map((chainLicense) => {
        const license = expressLicenses.find(l => l._id == chainLicense.external_id);
        return { ...license, chainLicense };
      });
  }

  async createExpressLicense({
    externalId,
    owner,
    requestId,
    researchExternalId,
    licensePlan
  }) {

    const result = await this.createOne({
      _id: externalId,
      owner,
      requestId,
      researchExternalId,
      licensePlan
    });

    return result;
  }

  async getExpressLicensesByResearches(researchExternalIds) {
    const expressLicenses = await this.findMany({ researchExternalId: { $in: researchExternalIds } });
    if (!expressLicenses.length) return [];
    const result = await this.mapExpressLicenses(expressLicenses);
    return result;
  }

  async getResearchLicense(externalId) {
    const expressLicenses = await this.findOne({ _id: externalId });
    if (!expressLicenses) return null;
    const result = await this.mapExpressLicenses(expressLicenses);
    return result;
  }

  async getResearchLicensesByLicensee(licensee) {
    const licenses = await deipRpc.api.getResearchLicensesByLicenseeAsync(licensee);
    const expressLicenses = await this.findMany({ _id: { $in: licenses.map(l => l._id) } });
    if (!expressLicenses.length) return [];
    const result = await this.mapExpressLicenses(expressLicenses);
    return result;
  }

  async getResearchLicensesByLicenser(licenser) {
    const licenses = await deipRpc.api.getResearchLicensesByLicenserAsync(licenser);
    const expressLicenses = await this.findMany({ _id: { $in: licenses.map(l => l._id) } });
    if (!expressLicenses.length) return [];
    const result = await this.mapExpressLicenses(expressLicenses);
    return result;
  }

  async getResearchLicensesByResearch(researchExternalId) {
    const expressLicenses = await this.findMany({ researchExternalId: researchExternalId });
    if (!expressLicenses.length) return [];
    const result = await this.mapExpressLicenses(expressLicenses);
    return result;
  }

  async getResearchLicensesByLicenseeAndResearch(licensee, researchId) {
    const licenses = await deipRpc.api.getResearchLicensesByLicenseeAndResearchAsync(licensee, researchId);
    const expressLicenses = await this.findMany({ _id: { $in: licenses.map(l => l._id) } });
    if (!expressLicenses.length) return [];
    const result = await this.mapExpressLicenses(expressLicenses);
    return result;
  }

  async getResearchLicensesByLicenseeAndLicenser(licensee, licenser) {
    const licenses = await deipRpc.api.getResearchLicensesByLicenseeAndLicenserAsync(licensee, licenser);
    const expressLicenses = await this.findMany({ _id: { $in: licenses.map(l => l._id) } });
    if (!expressLicenses.length) return [];
    const result = await this.mapExpressLicenses(expressLicenses);
    return result;
  }
}

export default ExpressLicensingService;