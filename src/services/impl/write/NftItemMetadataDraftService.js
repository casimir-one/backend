import BaseService from '../../base/BaseService';
import NftItemMetadataDraftSchema from '../../../schemas/NftItemMetadataDraftSchema';

class NftItemMetadataDraftService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(NftItemMetadataDraftSchema, options);
  }

  async createNftItemMetadataDraft({
    _id,
    nftCollectionId,
    owner,
    ownedByTeam,
    folder,
    attributes,
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
      nftCollectionId,
      owner,
      ownedByTeam,
      folder,
      title,
      attributes,
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

  async updateNftItemMetadataDraft({
    _id: id,
    folder,
    title,
    attributes,
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
    foreignReferences,
    moderationMessage
  }) {
    const updatedDraft = await this.updateOne({ _id: id }, {
      folder,
      title,
      attributes,
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
      foreignReferences,
      moderationMessage
    });

    return updatedDraft;
  }

  async deleteNftItemMetadataDraft(id) {
    const deletedDraft = await this.deleteOne({ _id: id});
    return deletedDraft;
  }

  async deleteNftItemMetadataDraftByHash(nftCollectionId, hash) {
    const deletedDraft = await this.deleteOne({ nftCollectionId, hash });
    return deletedDraft;
  }

  async getNftItemMetadataDraft(id) {
    const draft = await this.findOne({ _id: id });
    return draft;
  }

  async getNftItemMetadataDraftByHash(hash) {
    const draft = await this.findOne({ hash });
    return draft;
  }

  async getNftItemMetadataDraftsByNftCollection(nftCollectionId) {
    const drafts = await this.findMany({ nftCollectionId });
    return drafts;
  }

  async lookupNftItemMetadataDraftsWithPagination(filter, sort, pagination) {
    const drafts = await this.findManyPaginated(filter, sort, pagination);
    return drafts;
  }
}

export default NftItemMetadataDraftService;