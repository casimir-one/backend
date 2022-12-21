import BaseService from '../../base/BaseService';
import CollectionSchema from '../../../schemas/CollectionSchema';
import AttributeDtoService from './AttributeDtoService';
import { AttributeScope } from '@casimir.one/platform-core';

const attributeDtoService = new AttributeDtoService();

class CollectionDTOService extends BaseService {

  constructor(options = { scoped: true }) {
    super(CollectionSchema, options);
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
