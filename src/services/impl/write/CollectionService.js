import { AttributeScope } from '@casimir.one/platform-core';
import { isArray } from '@casimir.one/toolbox';
import mongoose from 'mongoose';
import CollectionSchema from '../../../schemas/CollectionSchema';
import { logWarn } from '../../../utils/log';
import BaseService from '../../base/BaseService';
import AttributeDtoService from '../read/AttributeDtoService';


class CollectionService extends BaseService {

  constructor(options = { scoped: true }) {
    super(CollectionSchema, options);
  }

  async getCollection(nftCollectionId) {
    const nftCollection = await this.findOne({ _id: nftCollectionId });
    return nftCollection || null;
  }

  async createCollection({
    _id,
    ownerId,
    attributes = [],
  }) {
    const mappedAttributes = await this.mapAttributes(attributes);
    const result = await this.createOne({
      _id,
      ownerId,
      attributes: mappedAttributes,
    });

    return result;
  }

  async updateCollection({
    _id,
    attributes
  }) {
    let mappedAttributes;
    if (attributes && isArray(attributes)) {
      mappedAttributes = await this.mapAttributes(attributes);
    }

    const result = await this.updateOne({ _id }, {
      attributes: attributes ? mappedAttributes : undefined
    });

    return result;
  }

  async mapAttributes(attributes) {
    const attributeDtoService = new AttributeDtoService();
    const nftCollectionAttributes = await attributeDtoService.getAttributesByScope(AttributeScope.NFT_COLLECTION );

    return attributes.map(rAttr => {
      const rAttrId = mongoose.Types.ObjectId(rAttr.attributeId.toString());

      const attribute = nftCollectionAttributes.find(a => a._id.toString() == rAttrId);
      let rAttrValue = null;

      if (!attribute) {
        logWarn(`WARNING: ${rAttrId} is obsolete attribute`);
      }

      if (!attribute || rAttr.value == null) {
        return {
          attributeId: rAttrId,
          value: rAttrValue
        };
      }

      rAttrValue = rAttr.value; //temp

      return {
        attributeId: rAttrId,
        value: rAttrValue
      }
    })
  }
}

export default CollectionService;