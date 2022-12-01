import { AttributeScope } from '@casimir.one/platform-core';
import { isArray } from '@casimir.one/toolbox';
import mongoose from 'mongoose';
import NFTCollectionSchema from '../../../schemas/NFTCollectionSchema';
import { logWarn } from '../../../utils/log';
import BaseService from '../../base/BaseService';
import AttributeDtoService from '../read/AttributeDtoService';


class NFTCollectionService extends BaseService {

  constructor(options = { scoped: true }) {
    super(NFTCollectionSchema, options);
  }

  async getNFTCollection(nftCollectionId) {
    const nftCollection = await this.findOne({ _id: nftCollectionId });
    return nftCollection || null;
  }

  async createNFTCollection({
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

  async updateNFTCollection({
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

export default NFTCollectionService;