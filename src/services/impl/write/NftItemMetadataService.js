import BaseService from '../../base/BaseService';
import NftItemMetadataSchema from '../../../schemas/NftItemMetadataSchema';

class NftItemMetadataService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(NftItemMetadataSchema, options);
  }

  async createNftItemMetadata({
    _id,
    nftCollectionId,
    owner,
    owneredByTeam,
    attributes,
    folder,
    title,
    hash,
    algo,
    contentType,
    formatType,
    packageFiles,
    jsonData,
    metadata,
    authors,
    references,
    foreignReferences,
    status
  }) {

    const result = await this.createOne({
      _id,
      nftCollectionId,
      owner,
      owneredByTeam,
      attributes,
      folder,
      title,
      hash,
      algo,
      contentType,
      formatType,
      packageFiles,
      jsonData,
      metadata,
      authors,
      references,
      foreignReferences,
      status
    });

    return result;
  }


  async updateNftItemMetadata({
    _id,
    owner,
    owneredByTeam,
    attributes,
    folder,
    title,
    hash,
    algo,
    contentType,
    formatType,
    packageFiles,
    jsonData,
    metadata,
    authors,
    references,
    foreignReferences,
    status,
  }) {

    const result = await this.updateOne({ _id }, {
      owner,
      owneredByTeam,
      attributes,
      folder,
      title,
      hash,
      algo,
      contentType,
      formatType,
      packageFiles,
      jsonData,
      metadata,
      authors,
      references,
      foreignReferences,
      status
    });

    return result;
  }

  async removeNftItemMetadataById(id) {
    const result = await this.deleteOne({ _id: id });
    return result;
  }
  
  async removeNftItemMetadataByHash(nftCollectionId, hash) {
    const result = await this.deleteOne({ nftCollectionId: nftCollectionId, hash });
    return result;
  }

  async findNftItemsMetadataByNftCollection(nftCollectionId) {
    const result = await this.findMany({ nftCollectionId });
    return result;
  }

  async getNftItemMetadata(nftItemId) {
    const result = await this.findOne({ _id: nftItemId });
    return result;
  }

  async findNftItemMetadataByHash(nftCollectionId, hash) {
    const result = await this.findOne({ nftCollectionId, hash });
    return result;
  }
}

export default NftItemMetadataService;