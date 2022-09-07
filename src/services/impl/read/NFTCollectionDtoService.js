import BaseService from '../../base/BaseService';
import NFTCollectionMetadataSchema from '../../../schemas/NFTCollectionMetadataSchema';
import AttributeDtoService from './AttributeDtoService';
import { AttributeScope } from '@casimir.one/platform-core';

const attributeDtoService = new AttributeDtoService();

class NFTCollectionDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(NFTCollectionMetadataSchema, options);
  }

  async mapNFTCollections(nftCollections, filterObj) {
    const nftCollectionsAttributes = await attributeDtoService.getAttributesByScope(AttributeScope.NFT_COLLECTION);

    const filter = {
      searchTerm: "",
      attributes: [],
      portalIds: [],
      ...filterObj
    }

    return nftCollections.map((nftCollection) => {
      return {
        _id: nftCollection._id,
        nextNftItemId: nftCollection.nextNftItemId,
        issuer: nftCollection.issuer,
        issuedByTeam: nftCollection.issuedByTeam,
        attributes: nftCollection.attributes,
        createdAt: nftCollection.createdAt,
        updatedAt: nftCollection.updatedAt,
        portalId: nftCollection.portalId
      };
    })
      .filter(p => !filter.portalIds.length || filter.portalIds.some(portalId => {
        return p.portalId == portalId;
      }))
      .filter(p => !filter.attributes.length || filter.attributes.every(fAttr => {
        const attribute = nftCollectionsAttributes.find(attr => attr._id.toString() === fAttr.attributeId.toString());
        if (!attribute)
          return false;

        const rAttr = p.attributes.find(rAttr => rAttr.attributeId.toString() === fAttr.attributeId.toString());
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
    const result = await this.mapNFTCollections(nftCollections, { ...filter });
    return result;
  }

  async getNFTCollectionsByIssuer(issuer) {
    const nftCollections = await this.findMany({ issuer: issuer });
    if (!nftCollections.length) return [];
    const result = await this.mapNFTCollections(nftCollections);
    return result;
  }

  async getNFTCollectionsByPortal(portalId) {
    const available = await this.findMany({});
    const nftCollections = available.filter(p => p.portalId == portalId);
    if (!nftCollections.length) return [];
    const result = await this.mapNFTCollections(nftCollections);
    return result;
  }
}

export default NFTCollectionDtoService;
