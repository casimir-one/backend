import { ChainService } from '@casimir.one/chain-service';
import config from '../../../config';
import NFTItemMetadataDraftSchema from '../../../schemas/NFTItemMetadataDraftSchema';
import BaseService from '../../base/BaseService';


class NFTItemDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(NFTItemMetadataDraftSchema, options);
  }

  async mapNFTItems(nftItemsMetadatas) {
    return nftItemsMetadatas.map((nftItemMetadata) => ({
      _id: nftItemMetadata._id,
      nftItemId: nftItemMetadata._id.nftItemId,
      owner: nftItemMetadata.owner,
      ownerAddress: nftItemMetadata.ownerAddress,
      ownedByTeam: nftItemMetadata.ownedByTeam,
      nftCollectionId: nftItemMetadata.nftCollectionId,
      authors: nftItemMetadata.authors,
      attributes: nftItemMetadata.attributes,
      hash: nftItemMetadata.hash,
      algo: nftItemMetadata.algo,
      status: nftItemMetadata.status,
      createdAt: nftItemMetadata.createdAt || nftItemMetadata.created_at,
      updatedAt: nftItemMetadata.updatedAt || nftItemMetadata.updated_at,
      portalId: nftItemMetadata.portalId
    }));
  }

  async getNFTItemsByPortal(portalId) {
    const nftItemsMetadata = await this.findMany({ portalId });
    if (!nftItemsMetadata.length) return [];
    const result = await this.mapNFTItems(nftItemsMetadata);
    return result;
  }

  async getNFTItemMetadataDraftsByNFTCollection(nftCollectionId) {
    const nftItemsMetadata = await this.findMany({ nftCollectionId });
    if (!nftItemsMetadata.length) return [];
    const result = await this.mapNFTItems(nftItemsMetadata);
    return result;  
  }

  async lookupNFTItemMetadataDraftsWithPagination(filter, sort, pagination) {
    const drafts = await this.findManyPaginated(filter, sort, pagination);
    return drafts;
  }

}

export default NFTItemDtoService;
