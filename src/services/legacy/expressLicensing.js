import ProjectExpressLicenseSchema from './../../schemas/ProjectExpressLicenseSchema';
import BaseService from './../base/BaseService';
import config from './../../config';
import { ChainService } from '@deip/chain-service';


class ExpressLicensingService extends BaseService {

  constructor(options = { scoped: true }) {
    super(ProjectExpressLicenseSchema, options);
  }

  async mapExpressLicenses(expressLicenses) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const researchLicenses = await chainApi.getProjectLicensesAsync(expressLicenses.map(l => l._id));
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
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const licenses = await chainApi.getProjectLicensesByLicenseeAsync(licensee);
    const expressLicenses = await this.findMany({ _id: { $in: licenses.map(l => l._id) } });
    if (!expressLicenses.length) return [];
    const result = await this.mapExpressLicenses(expressLicenses);
    return result;
  }

  async getResearchLicensesByLicenser(licenser) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const licenses = await chainApi.getProjectLicensesByLicenserAsync(licenser);
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
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const licenses = await chainApi.getProjectLicensesByLicenseeAndProjectAsync(licensee, researchId);
    const expressLicenses = await this.findMany({ _id: { $in: licenses.map(l => l._id) } });
    if (!expressLicenses.length) return [];
    const result = await this.mapExpressLicenses(expressLicenses);
    return result;
  }

  async getResearchLicensesByLicenseeAndLicenser(licensee, licenser) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const licenses = await chainApi.getProjectLicensesByLicenseeAndLicenserAsync(licensee, licenser);
    const expressLicenses = await this.findMany({ _id: { $in: licenses.map(l => l._id) } });
    if (!expressLicenses.length) return [];
    const result = await this.mapExpressLicenses(expressLicenses);
    return result;
  }
}

export default ExpressLicensingService;