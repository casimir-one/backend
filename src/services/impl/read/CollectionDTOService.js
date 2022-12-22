import BaseService from '../../base/BaseService';
import CollectionSchema from '../../../schemas/CollectionSchema';


class CollectionDTOService extends BaseService {

  constructor(options = { scoped: true }) {
    super(CollectionSchema, options);
  }

  async mapDTOs(nftCollections) {
    return nftCollections.map((nftCollection) => {
      return {
        _id: nftCollection._id,
        ownerId: nftCollection.ownerId,
        attributes: nftCollection.attributes,
        createdAt: nftCollection.createdAt,
        updatedAt: nftCollection.updatedAt,
        portalId: nftCollection.portalId
      };
    });
  }

  async getCollectionDTO(id) {
    const nftCollection = await this.findOne({ _id: id });
    if (!nftCollection) return null;
    const results = await this.mapDTOs([nftCollection]);
    const [result] = results;
    return result;
  }

  async getCollectionsDTOsPaginated(filter, sort, pagination) {
    const f = filter || {};
    const { paginationMeta, result: nftItems } = await this.findManyPaginated(f, sort, pagination);
    const result = await this.mapDTOs(nftItems);
    return { paginationMeta, result };
  }

}

export default CollectionDTOService;
