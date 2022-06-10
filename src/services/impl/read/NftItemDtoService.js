import BaseService from '../../base/BaseService';
import config from '../../../config';
import { ChainService } from '@deip/chain-service';
import NftItemMetadataSchema from '../../../schemas/NftItemMetadataSchema';


class NftItemDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(NftItemMetadataSchema, options);
  }

  async mapNftItems(nftItemsMetadatas) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const uniqueCollections = nftItemsMetadatas.filter((item, i, arr) => arr.findIndex(({
      nftCollectionId,
      owner
    }) => owner == item.owner && nftCollectionId == item.nftCollectionId) === i);

    const chainNftItems = await Promise.all(
      uniqueCollections.map(({ nftCollectionId, owner }) => chainRpc.getNonFungibleTokenClassInstancesByOwnerAsync(owner, nftCollectionId))
    );

    return nftItemsMetadatas.map((nftItemMetadata) => {
      let chainNftItem = chainNftItems.find((chainNftItem) =>
        chainNftItem
        && chainNftItem.nftItemsIds.some(id => id == nftItemMetadata._id.nftItemId)
        && chainNftItem.nftCollectionId == nftItemMetadata._id.nftCollectionId
      );

      if (!chainNftItem) {
        console.warn(`NftItem with ID '${nftItemMetadata._id.nftItemId}' is not found in the Chain`);
        chainNftItem = {};
      }

      return {
        _id: nftItemMetadata._id,
        nftItemId: nftItemMetadata._id.nftItemId,
        owner: chainNftItem.account,
        ownedByTeam: nftItemMetadata.ownedByTeam,
        nftCollectionId: chainNftItem.nftCollectionId,
        metadata: {
          _id: nftItemMetadata._id,
          portalId: nftItemMetadata.portalId,
          nftCollectionId: nftItemMetadata.nftCollectionId,
          owner: nftItemMetadata.teamId,
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
      };
    });
  }

  async getNftItem(nftItemId) {
    const nftItemMetadata = await this.findOne({ _id: nftItemId });
    if (!nftItemMetadata) return null;
    const [result] = await this.mapNftItems([nftItemMetadata]);
    return result;
  }


  async getNftItems(nftItemIds) {
    const nftItemsMetadata = await this.findMany({ _id: { $in: [...nftItemIds] } });
    if (!nftItemsMetadata.length) return [];
    const result = await this.mapNftItems(nftItemsMetadata);
    return result;
  }

  async lookupNftItems() {
    const nftItemsMetadata = await this.findMany({});
    if(!nftItemsMetadata.length) return [];

    const result = await this.mapNftItems(nftItemsMetadata);
    return result;
  }

  async lookupNftItemsWithPagination(filter, sort, pagination) {
    const { paginationMeta, result: nftItemsMetadata } = await this.findManyPaginated(filter, sort, pagination);

    const result = await this.mapNftItems(nftItemsMetadata);
    return { paginationMeta, result };
  }

  async getNftItemsByNftCollection(nftCollectionId) {
    const nftItemsMetadata = await this.findMany({ nftCollectionId });
    if (!nftItemsMetadata.length) return [];
    const result = await this.mapNftItems(nftItemsMetadata);
    return result;
  }

  async getNftItemsByPortal(portalId) {
    const available = await this.findMany({});
    const nftItemsMetadata = available.filter(r => r.portalId == portalId);
    if (!nftItemsMetadata.length) return [];
    const result = await this.mapNftItems(nftItemsMetadata);
    return result;
  }

  async getNonFungibleTokenClassInstancesByOwner(account, nftCollectionId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const result = await chainRpc.getNonFungibleTokenClassInstancesByOwnerAsync(account, nftCollectionId);
    return result;
  }

  async getNonFungibleTokenClassesInstancesByOwner(account) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const result = await chainRpc.getNonFungibleTokenClassesInstancesByOwnerAsync(account);
    return result;
  }
}

export default NftItemDtoService;
