import BaseService from '../../base/BaseService';
import ProjectContentSchema from './../../../schemas/ProjectContentSchema';

class ProjectContentService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ProjectContentSchema, options);
  }

  async createProjectContentRef({
    externalId,
    projectId,
    teamId,
    folder,
    researchId, // legacy internal id
    title,
    hash,
    algo,
    contentType,
    formatType,
    packageFiles,
    jsonData,
    authors,
    references,
    foreignReferences
  }) {

    const result = await this.createOne({
      _id: externalId,
      researchExternalId: projectId,
      researchGroupExternalId: teamId,
      folder,
      researchId, // legacy internal id
      title,
      hash,
      algo,
      contentType,
      formatType,
      packageFiles,
      jsonData,
      authors,
      references,
      foreignReferences
    });

    return result;
  }


  async updateProjectContentRef(externalId, {
    folder,
    title,
    hash,
    algo,
    contentType,
    formatType,
    packageFiles,
    jsonData,
    authors,
    references,
    foreignReferences
  }) {

    const result = await this.updateOne({ _id: externalId }, {
      folder,
      title,
      hash,
      algo,
      contentType,
      formatType,
      packageFiles,
      jsonData,
      authors,
      references,
      foreignReferences
    });

    return result;
  }

  async removeProjectContentRefById(externalId) {
    const result = await this.deleteOne({ _id: externalId });
    return result;
  }
  
  async removeProjectContentRefByHash(projectId, hash) {
    const result = await this.deleteOne({ researchExternalId: projectId, hash });
    return result;
  }

  proposalIsNotExpired(proposal) { return proposal != null; }

}

export default ProjectContentService;