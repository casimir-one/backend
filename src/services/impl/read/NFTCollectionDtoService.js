import BaseService from '../../base/BaseService';
import NFTCollectionSchema from '../../../schemas/NFTCollectionSchema';
import AttributeDtoService from './AttributeDtoService';
import { AttributeScope } from '@casimir.one/platform-core';

const attributeDtoService = new AttributeDtoService();

class NFTCollectionDTOService extends BaseService {

  constructor(options = { scoped: true }) {
    super(NFTCollectionSchema, options);
  }

  async mapDTOs(nftCollections, filterObj) {
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
        ownerId: nftCollection.ownerId,
        attributes: nftCollection.attributes,
        createdAt: nftCollection.createdAt,
        updatedAt: nftCollection.updatedAt,
        portalId: nftCollection.portalId
      };
    }) // TODO: Replace with db query
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

  async getNFTCollectionDTO(id) {
    const nftCollection = await this.findOne({ _id: id });
    if (!nftCollection) return null;
    const results = await this.mapDTOs([nftCollection]);
    const [result] = results;
    return result;
  }

  async getNFTCollectionsDTOs(filter) {
    const f = filter && filter.ids ? { _id: { $in: [...filter.ids] } } : {};
    const nftCollections = await this.findMany(f);
    if (!nftCollections.length) return [];
    const result = await this.mapDTOs(nftCollections, { ...filter });
    return result;
  }

}

export default NFTCollectionDTOService;
