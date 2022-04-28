import BaseService from './../../base/BaseService';
import DraftSchema from './../../../schemas/DraftSchema';

class DraftService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(DraftSchema, options);
  }

  async createDraft({
    _id,
    projectId,
    teamId,
    folder,
    title,
    hash,
    algo,
    contentType,
    formatType,
    status,
    packageFiles,
    jsonData,
    metadata,
    authors,
    references,
    foreignReferences
  }) {
    const draft = await this.createOne({
      _id,
      projectId,
      teamId,
      folder,
      title,
      hash,
      algo,
      contentType,
      formatType,
      status,
      packageFiles,
      jsonData,
      metadata,
      authors,
      references,
      foreignReferences
    });

    return draft;
  }

  async updateDraft({
    _id: id,
    folder,
    title,
    hash,
    algo,
    contentType,
    formatType,
    status,
    packageFiles,
    jsonData,
    metadata,
    authors,
    references,
    foreignReferences
  }) {
    const updatedDraft = await this.updateOne({ _id: id }, {
      folder,
      title,
      hash,
      algo,
      contentType,
      formatType,
      status,
      packageFiles,
      jsonData,
      metadata,
      authors,
      references,
      foreignReferences
    });

    return updatedDraft;
  }

  async deleteDraft(id) {
    const deletedDraft = await this.deleteOne({ _id: id});
    return deletedDraft;
  }

  async deleteDraftByHash(projectId, hash) {
    const deletedDraft = await this.deleteOne({ projectId, hash });
    return deletedDraft;
  }

  async getDraft(id) {
    const draft = await this.findOne({ _id: id });
    return draft;
  }

  async getDraftByHash(hash) {
    const draft = await this.findOne({ hash });
    return draft;
  }

  async getDraftsByProject(projectId) {
    const drafts = await this.findMany({ projectId });
    return drafts;
  }
}

export default DraftService;