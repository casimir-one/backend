import CollectionSchema from '../../../schemas/CollectionSchema';
import BaseService from '../../base/BaseService';


class CollectionService extends BaseService {

  constructor(options = { scoped: true }) {
    super(CollectionSchema, options);
  }

  async getCollection(nftCollectionId) {
    const nftCollection = await this.findOne({ _id: nftCollectionId });
    return nftCollection || null;
  }

  async createCollection({
    _id,
    ownerId,
    attributes = [],
  }) {

    const result = await this.createOne({
      _id,
      ownerId,
      attributes: attributes,
    });

    return result;
  }

  async updateCollection({
    _id,
    attributes
  }) {

    const result = await this.updateOne({ _id }, {
      attributes: attributes ? attributes : undefined
    });

    return result;
  }

}

export default CollectionService;