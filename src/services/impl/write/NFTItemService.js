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
    _id,
    nftCollectionId,
    nftItemId,
    ownerId,
    creatorId,
    attributes,
    hash,
    algo,
    status,
  }) {

    const nftItem = await this.createOne({
      _id,
      nftCollectionId,
      nftItemId,
      ownerId,
      creatorId,
      attributes,
      hash,
      algo,
      status,
    });

    return nftItem;
  }

  async updateNFTItem({
    _id: id,
    attributes,
    hash,
    algo,
    status,
    queueNumber,
  }) {

    const updatedNftItem = await this.updateOne({ _id: id }, {
      attributes,
      hash,
      algo,
      status,
      queueNumber,
    });

    return updatedNftItem;
  }

  async deleteNFTItem(id) {
    const deletedNftItem = await this.deleteOne({ _id: id });
    return deletedNftItem;
  }

}

export default NFTItemService;