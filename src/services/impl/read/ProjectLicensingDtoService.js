import BaseService from './../../base/BaseService';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import ProjectLicenseSchema from './../../../schemas/ProjectLicenseSchema';

class ProjectLicensingDtoService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ProjectLicenseSchema, options);
  }

  async mapProjectLicenses(licenses) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();

    const projectLicenses = await Promise.all(licenses.map(l => chainApi.getContractAgreementAsync(l._id)));
    const result = [];
    projectLicenses
      .forEach((chainContract) => {
        if (chainContract) {
          const license = licenses.find(l => l._id == chainContract.external_id);
          result.push({ ...license, chainContract });
        }
      });

    return result;
  }

  async getProjectLicensesByProjects(projectIds) {
    const projectLicenses = await this.findMany({ projectId: { $in: projectIds } });
    if (!projectLicenses.length) return [];
    const result = await this.mapProjectLicenses(projectLicenses);
    return result;
  }
  
  async getProjectLicense(projectLicenseId) {
    const projectLicense = await this.findOne({ _id: projectLicenseId });
    if (!projectLicense) return null;
    const result = await this.mapProjectLicenses([projectLicense]);
    return result[0];
  }
  
  async getProjectLicensesByLicensee(licensee) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
  
    const licenses = await chainApi.getProjectLicensesByLicenseeAsync(licensee);
    const projectLicenses = await this.findMany({ _id: { $in: licenses.map(l => l._id) } });
    if (!projectLicenses.length) return [];
    const result = await this.mapProjectLicenses(projectLicenses);
    return result;
  }
  
  async getProjectLicensesByLicenser(licenser) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
  
    const licenses = await chainApi.getProjectLicensesByLicenserAsync(licenser);
    const projectLicenses = await this.findMany({ _id: { $in: licenses.map(l => l._id) } });
    if (!projectLicenses.length) return [];
    const result = await this.mapProjectLicenses(projectLicenses);
    return result;
  }
  
  async getProjectLicensesByProject(projectId) {
    const projectLicenses = await this.findMany({ projectId });
    if (!projectLicenses.length) return [];
    const result = await this.mapProjectLicenses(projectLicenses);
    return result;
  }
  
  async getProjectLicensesByLicenseeAndProject(licensee, projectId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
  
    const licenses = await chainApi.getProjectLicensesByLicenseeAndProjectAsync(licensee, projectId);
    const projectLicenses = await this.findMany({ _id: { $in: licenses.map(l => l._id) } });
    if (!projectLicenses.length) return [];
    const result = await this.mapProjectLicenses(projectLicenses);
    return result;
  }
  
  async getProjectLicensesByLicenseeAndLicenser(licensee, licenser) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainApi = chainService.getChainApi();
  
    const licenses = await chainApi.getProjectLicensesByLicenseeAndLicenserAsync(licensee, licenser);
    const projectLicenses = await this.findMany({ _id: { $in: licenses.map(l => l._id) } });
    if (!projectLicenses.length) return [];
    const result = await this.mapProjectLicenses(projectLicenses);
    return result;
  }
}

export default ProjectLicensingDtoService;