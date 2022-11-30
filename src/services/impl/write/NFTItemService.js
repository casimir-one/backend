import BaseService from '../../base/BaseService';
import NFTItemSchema from '../../../schemas/NFTItemSchema';

class NFTItemService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(NFTItemSchema, options);
  }

  async getNFTItem(id) {
    const nftItem = await this.findOne({ _id: id });
    return nftItem;
  }

  async createNFTItem({
    _id: nftItemId,
    nftCollectionId,
    ownerId,
    creatorId,
    attributes,
    hash,
    algo,
    status,
  }) {

    const nftItem = await this.createOne({
      _id: nftItemId,
      nftCollectionId,
      ownerId,
      creatorId,
      attributes,
      hash,
      algo,
      status,
    });

    return nftItem;
  }

  async updateNFTItem(nftItemId, {
    attributes,
    hash,
    algo,
    status,
    queueNumber,
  }) {

    const updatedNftItem = await this.updateOne({ _id: nftItemId }, {
      attributes,
      hash,
      algo,
      status,
      queueNumber,
    });

    return updatedNftItem;
  }

  async deleteNFTItem(nftItemId) {
    const deletedNftItem = await this.deleteOne({ _id: nftItemId });
    return deletedNftItem;
  }

}

export default NFTItemService;