import BaseService from '../../base/BaseService';
import NFTCollectionMetadataSchema from '../../../schemas/NFTCollectionMetadataSchema';
import config from '../../../config';
import { ChainService } from '@deip/chain-service';
import AttributeDtoService from './AttributeDtoService';

const attributeDtoService = new AttributeDtoService();

class NFTCollectionDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(NFTCollectionMetadataSchema, options);
  }

  async mapNFTCollections(nftCollections, filterObj) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainNftCollections = await chainRpc.getNonFungibleTokenClassesAsync();
    const nftCollectionsAttributes = await attributeDtoService.getAttributesByScope('nftCollection');

    const filter = {
      searchTerm: "",
      attributes: [],
      portalIds: [],
      isDefault: undefined,
      ...filterObj
    }

    return nftCollections.map((nftCollection) => {
      let chainNftCollection = chainNftCollections.find((chainNftCollection) => chainNftCollection && chainNftCollection.nftCollectionId == nftCollection._id);
      if (!chainNftCollection) {
        console.warn(`NftCollection with ID '${nftCollection._id}' is not found in the Chain`);
        chainNftCollection = {};
      }

      return {
        _id: chainNftCollection.nftCollectionId,
        nftCollectionId: chainNftCollection.nftCollectionId,
        nftItemsCount: chainNftCollection.nftItemsCount,
        instanceMetadatasCount: chainNftCollection.instanceMetadatasCount,
        nextNftItemId: nftCollection.nextNftItemId,
        issuer: nftCollection.issuer,
        symbol: chainNftCollection.symbol,
        attributesCount: chainNftCollection.attributesCount,
        totalDeposit: chainNftCollection.totalDeposit,
        name: chainNftCollection.name || chainNftCollection.symbol,
        owner: chainNftCollection.owner,
        admin: chainNftCollection.admin,
        freezer: chainNftCollection.freezer,
        issuedByTeam: nftCollection.issuedByTeam,
        metadata: {
          _id: nftCollection._id,
          issuer: nftCollection.issuer,
          attributes: nftCollection.attributes,
          isDefault: nftCollection.isDefault,
          portalId: nftCollection.portalId,
          createdAt: nftCollection.createdAt,
          updatedAt: nftCollection.updatedAt
        },
        portalId: nftCollection.portalId
      };
    })
      .filter(p => filter.isDefault === undefined || filter.isDefault === p.metadata.isDefault)
      .filter(p => !filter.portalIds.length || filter.portalIds.some(portalId => {
        return p.portalId == portalId;
      }))
      .filter(p => !filter.attributes.length || filter.attributes.every(fAttr => {
        const attribute = nftCollectionsAttributes.find(attr => attr._id.toString() === fAttr.attributeId.toString());
        if (!attribute)
          return false;

        const rAttr = p.metadata.attributes.find(rAttr => rAttr.attributeId.toString() === fAttr.attributeId.toString());
        return fAttr.values.some((v) => {
          if (!rAttr || !rAttr.value)
            return !v || v === 'false';

          if (Array.isArray(rAttr.value))
            return rAttr.value.some(rAttrV => rAttrV.toString() === v.toString());

          if (typeof rAttr.value === 'string')
            return rAttr.value.includes(v.toString());

          return rAttr.value.toString() === v.toString();
        });
      }))
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async getNFTCollection(nftCollectionId) {
    const nftCollectionMetadata = await this.findOne({ _id: nftCollectionId });
    if (!nftCollectionMetadata) return null;
    const results = await this.mapNFTCollections([nftCollectionMetadata]);
    const [result] = results;
    return result;
  }

  async getNFTCollections(nftCollectionIds) {
    const nftCollections = await this.findMany({ _id: { $in: [...nftCollectionIds] } });
    if (!nftCollections.length) return [];
    const result = await this.mapNFTCollections(nftCollections);
    return result;
  }

  async lookupNFTCollections(filter) {
    const nftCollections = await this.findMany({});
    if (!nftCollections.length) return [];
    const result = await this.mapNFTCollections(nftCollections, { ...filter, isDefault: false });
    return result;
  }

  async getNFTCollectionsByIssuer(issuer) {
    const nftCollections = await this.findMany({ issuer: issuer });
    if (!nftCollections.length) return [];
    const result = await this.mapNFTCollections(nftCollections, { isDefault: false });
    return result;
  }

  async getNFTCollectionsByPortal(portalId) {
    const available = await this.findMany({});
    const nftCollections = available.filter(p => p.portalId == portalId);
    if (!nftCollections.length) return [];
    const result = await this.mapNFTCollections(nftCollections, { isDefault: false });
    return result;
  }

  async getDefaultNFTCollection(daoId) {
    const nftCollection = await this.findOne({ isDefault: true, daoId });
    if (!nftCollection) return null;
    const results = await this.mapNFTCollections([nftCollection], { isDefault: true });
    const [result] = results;
    return result;
  }

}

export default NFTCollectionDtoService;
