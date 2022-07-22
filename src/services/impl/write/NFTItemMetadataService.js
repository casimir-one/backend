import BaseService from '../../base/BaseService';
import NFTItemMetadataSchema from '../../../schemas/NFTItemMetadataSchema';

class NFTItemMetadataService extends BaseService {

  constructor(options = { scoped: true }) {
    super(NFTItemMetadataSchema, options);
  }

  buildId = ({ nftCollectionId, nftItemId }) => ({ nftItemId: String(nftItemId), nftCollectionId: String(nftCollectionId) });

  async createNFTItemMetadata({
    nftCollectionId,
    nftItemId,
    owner,
    ownerAddress,
    ownedByTeam,
    attributes,
    hash,
    algo,
    authors,
  }) {

    const result = await this.createOne({
      _id: this.buildId({ nftCollectionId, nftItemId }),
      nftCollectionId,
      owner,
      ownerAddress,
      ownedByTeam,
      attributes,
      hash,
      algo,
      authors,
    });

    return result;
  }


  async updateNFTItemMetadata({
    nftCollectionId,
    nftItemId,
    owner,
    ownerAddress,
    ownedByTeam,
    attributes,
    hash,
    algo,
    authors,
  }) {

    const result = await this.updateOne({ _id: this.buildId({ nftItemId, nftCollectionId }) }, {
      owner,
      ownerAddress,
      ownedByTeam,
      attributes,
      hash,
      algo,
      authors,
    });

    return result;
  }

  async removeNFTItemMetadataById({ nftItemId, nftCollectionId }) {
    const result = await this.deleteOne({ _id: this.buildId({ nftItemId, nftCollectionId }) });
    return result;
  }

  async removeNFTItemMetadataByHash(nftCollectionId, hash) {
    const result = await this.deleteOne({ nftCollectionId, hash });
    return result;
  }

  async findNFTItemsMetadataByNftCollection(nftCollectionId) {
    const result = await this.findMany({ nftCollectionId });
    return result;
  }

  async getNFTItemMetadata({ nftItemId, nftCollectionId }) {
    const result = await this.findOne({ _id: this.buildId({ nftItemId, nftCollectionId }) });
    return result;
  }

  async findNFTItemMetadataByHash(nftCollectionId, hash) {
    const result = await this.findOne({ nftCollectionId, hash });
    return result;
  }
}

export default NFTItemMetadataService;