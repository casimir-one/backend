import BaseService from '../../base/BaseService';
import ItemSchema from '../../../schemas/ItemSchema';

class ItemService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ItemSchema, options);
  }

  async getItem(id) {
    const nftItem = await this.findOne({ _id: id });
    return nftItem;
  }

  async createItem({
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

  async updateItem(nftItemId, {
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

  async deleteItem(nftItemId) {
    const result = await this.deleteOne({ _id: nftItemId });
    return result;
  }

}

export default ItemService;