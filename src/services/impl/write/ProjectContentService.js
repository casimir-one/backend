import BaseService from '../../base/BaseService';
import ProjectContentSchema from './../../../schemas/ProjectContentSchema';

class ProjectContentService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ProjectContentSchema, options);
  }

  async createProjectContentRef({
    _id,
    projectId,
    teamId,
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

    const result = await this.createOne({
      _id,
      projectId,
      teamId,
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


  async updateProjectContentRef(id, {
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

    const result = await this.updateOne({ _id: id }, {
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

  async removeProjectContentRefById(id) {
    const result = await this.deleteOne({ _id: id });
    return result;
  }
  
  async removeProjectContentRefByHash(projectId, hash) {
    const result = await this.deleteOne({ projectId: projectId, hash });
    return result;
  }

  proposalIsNotExpired(proposal) { return proposal != null; }

}

export default ProjectContentService;