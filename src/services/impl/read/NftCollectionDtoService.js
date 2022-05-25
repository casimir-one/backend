import BaseService from '../../base/BaseService';
import NftCollectionMetadataSchema from '../../../schemas/NftCollectionMetadataSchema';
import config from '../../../config';
import { ChainService } from '@deip/chain-service';
import AttributeDtoService from './AttributeDtoService';
import { ATTR_SCOPES } from '@deip/constants';

const attributeDtoService = new AttributeDtoService();

class NftCollectionDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(NftCollectionMetadataSchema, options);
  }

  async mapNftCollections(nftCollections, filterObj) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainNftCollections = await chainRpc.getNonFungibleTokenClassesAsync();
    const projectsAttributes = await attributeDtoService.getAttributesByScope(ATTR_SCOPES.PROJECT || 'project');

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
        const attribute = projectsAttributes.find(attr => attr._id.toString() === fAttr.attributeId.toString());
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

  async getNftCollection(nftCollectionId) {
    const nftCollectionMetadata = await this.findOne({ _id: nftCollectionId });
    if (!nftCollectionMetadata) return null;
    const results = await this.mapNftCollections([nftCollectionMetadata]);
    const [result] = results;
    return result;
  }

  async getNftCollections(nftCollectionsIds) {
    const nftCollections = await this.findMany({ _id: { $in: [...nftCollectionsIds] } });
    if (!nftCollections.length) return [];
    const result = await this.mapNftCollections(nftCollections);
    return result;
  }

  async lookupNftCollections(filter) {
    const nftCollections = await this.findMany({});
    if (!nftCollections.length) return [];
    const result = await this.mapNftCollections(nftCollections, { ...filter, isDefault: false });
    return result;
  }

  async getNftCollectionsByIssuer(daoId) {
    const nftCollections = await this.findMany({ daoId });
    if (!nftCollections.length) return [];
    const result = await this.mapNftCollections(nftCollections, { isDefault: false });
    return result;
  }

  async getNftCollectionsByPortal(portalId) {
    const available = await this.findMany({});
    const nftCollections = available.filter(p => p.portalId == portalId);
    if (!nftCollections.length) return [];
    const result = await this.mapNftCollections(nftCollections, { isDefault: false });
    return result;
  }

  async getDefaultNftCollection(daoId) {
    const nftCollection = await this.findOne({ isDefault: true, daoId });
    if (!nftCollection) return null;
    const results = await this.mapNftCollections([nftCollection], { isDefault: true });
    const [result] = results;
    return result;
  }

}

export default NftCollectionDtoService;
