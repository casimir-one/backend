import NFTItemSchema from '../../../schemas/NFTItemSchema';
import BaseService from '../../base/BaseService';


class NFTItemDTOService extends BaseService {

  constructor(options = { scoped: true }) {
    super(NFTItemSchema, options);
  }

  async mapDTOs(nftItems) {
    return nftItems.map((nftItem) => ({
      _id: nftItem._id,
      nftItemId: nftItem.nftItemId,
      ownerId: nftItem.ownerId,
      creatorId: nftItem.creatorId,
      nftCollectionId: nftItem.nftCollectionId,
      attributes: nftItem.attributes,
      hash: nftItem.hash,
      algo: nftItem.algo,
      status: nftItem.status,
      createdAt: nftItem.createdAt || nftItem.created_at,
      updatedAt: nftItem.updatedAt || nftItem.updated_at,
      portalId: nftItem.portalId
    }));
  }

  async getNFTItemDTO(id) {
    const nftItem = await this.findOne({ _id: id });
    if (!nftItem) return null;
    const results = await this.mapDTOs([nftItem]);
    const [result] = results;
    return result;
  }

  async getNFTItemsDTOsPaginated(filter, sort, pagination) {
    const f = filter || {};
    const { paginationMeta, result: nftItems } = await this.findManyPaginated(f, sort, pagination);
    const result = await this.mapDTOs(nftItems);
    return { paginationMeta, result };
  }

}

export default NFTItemDTOService;
