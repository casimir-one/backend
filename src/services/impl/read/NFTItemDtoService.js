import { ChainService } from '@deip/chain-service';
import config from '../../../config';
import NFTItemMetadataSchema from '../../../schemas/NFTItemMetadataSchema';
import BaseService from '../../base/BaseService';


class NFTItemDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(NFTItemMetadataSchema, options);
  }

  async mapNFTItems(nftItemsMetadatas) {

    return nftItemsMetadatas.map((nftItemMetadata) => ({
      _id: nftItemMetadata._id,
      nftItemId: nftItemMetadata._id.nftItemId,
      owner: nftItemMetadata.owner,
      ownerAddress: nftItemMetadata.ownerAddress,
      ownedByTeam: nftItemMetadata.ownedByTeam,
      nftCollectionId: nftItemMetadata.nftCollectionId,
      metadata: {
        _id: nftItemMetadata._id,
        portalId: nftItemMetadata.portalId,
        nftCollectionId: nftItemMetadata.nftCollectionId,
        title: nftItemMetadata.title,
        folder: nftItemMetadata.folder,
        authors: nftItemMetadata.authors,
        hash: nftItemMetadata.hash,
        algo: nftItemMetadata.algo,
        type: nftItemMetadata.type,
        status: nftItemMetadata.status,
        packageFiles: nftItemMetadata.packageFiles,
        references: nftItemMetadata.references,
        foreignReferences: nftItemMetadata.foreignReferences,
        createdAt: nftItemMetadata.createdAt || nftItemMetadata.created_at,
        updatedAt: nftItemMetadata.updatedAt || nftItemMetadata.updated_at,
        metadata: nftItemMetadata.metadata,
        contentType: nftItemMetadata.contentType,
        formatType: nftItemMetadata.formatType,
      },
      portalId: nftItemMetadata.portalId
    }));
  }

  async getNFTItem({ nftItemId, nftCollectionId }) {
    const nftItemMetadata = await this.findOne({ _id: { nftItemId, nftCollectionId } });
    if (!nftItemMetadata) return null;
    const [result] = await this.mapNFTItems([nftItemMetadata]);
    return result;
  }


  async getNFTItems(nftItemIds) {
    const nftItemsMetadata = await this.findMany({ _id: { $in: [...nftItemIds] } });
    if (!nftItemsMetadata.length) return [];
    const result = await this.mapNFTItems(nftItemsMetadata);
    return result;
  }

  async lookupNFTItems() {
    const nftItemsMetadata = await this.findMany({});
    if (!nftItemsMetadata.length) return [];

    const result = await this.mapNFTItems(nftItemsMetadata);
    return result;
  }

  async lookupNFTItemsWithPagination(filter, sort, pagination) {
    const { paginationMeta, result: nftItemsMetadata } = await this.findManyPaginated(filter, sort, pagination);

    const result = await this.mapNFTItems(nftItemsMetadata);
    return { paginationMeta, result };
  }

  async getNFTItemsByNFTCollection(nftCollectionId) {
    const nftItemsMetadata = await this.findMany({ nftCollectionId });
    if (!nftItemsMetadata.length) return [];
    const result = await this.mapNFTItems(nftItemsMetadata);
    return result;
  }

  async getNFTItemsByPortal(portalId) {
    const available = await this.findMany({});
    const nftItemsMetadata = available.filter(r => r.portalId == portalId);
    if (!nftItemsMetadata.length) return [];
    const result = await this.mapNFTItems(nftItemsMetadata);
    return result;
  }

  async getNFTItemsByOwnerAndNFTCollection(account, nftCollectionId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const result = await chainRpc.getNonFungibleTokenClassInstancesByOwnerAsync(account, nftCollectionId);
    return result;
  }

  async getNFTItemsByOwner(account) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const result = await chainRpc.getNonFungibleTokenClassesInstancesByOwnerAsync(account);
    return result;
  }
}

export default NFTItemDtoService;
