import BaseService from './../../base/BaseService';
import ProjectLicenseSchema from './../../../schemas/ProjectLicenseSchema';

class ProjectLicensingService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ProjectLicenseSchema, options);
  }

  async createProjectLicense({
    licenseId,
    parties,
    acceptedByParties,
    creator,
    hash,
    startTime,
    endTime,
    type,
    terms,
    status,
    proposalId
  }) {

    const result = await this.createOne({
      _id: licenseId,
      creator,
      parties,
      hash,
      startTime,
      endTime,
      acceptedByParties,
      type,
      proposalId,
      terms,
      status,
      owner: creator,
      requestId: proposalId,
      researchExternalId: terms.projectId,
      projectId: terms.projectId,
      licensePlan: terms,
    });

    return result;
  }

  async updateProjectLicense({
    _id,
    status,
    acceptedByParties
  }) {
    const result = await this.updateOne({ _id }, {
      status,
      acceptedByParties
    });

    return result;
  }

}

export default ProjectLicensingService;