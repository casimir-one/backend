import { isArray } from '@deip/toolbox';
import mongoose from 'mongoose';
import NFTCollectionMetadataSchema from '../../../schemas/NFTCollectionMetadataSchema';
import { logWarn } from '../../../utils/log';
import BaseService from '../../base/BaseService';
import AttributeDtoService from '../read/AttributeDtoService';


class NFTCollectionMetadataService extends BaseService {

  constructor(options = { scoped: true }) {
    super(NFTCollectionMetadataSchema, options);
  }

  async getNFTCollectionMetadata(nftCollectionId) {
    const nftCollection = await this.findOne({ _id: nftCollectionId });
    return nftCollection || null;
  }

  async getNFTCollectionMetadatas(nftCollectionIds) {
    const nftCollection = await this.findMany({ _id: { $in: [...nftCollectionIds] } });
    return nftCollection || null;
  }

  async createNFTCollectionMetadata({
    _id,
    issuer,
    attributes = [],
    issuedByTeam
  }) {
    const mappedAttributes = await this.mapAttributes(attributes);
    const result = await this.createOne({
      _id,
      issuer,
      attributes: mappedAttributes,
      issuedByTeam
    })

    return result;
  }


  async updateNFTCollectionMetadata({
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

  async increaseNftCollectionNextItemId(_id) {
    const result = await this._schema.updateOne({ _id: String(_id) },
      { $inc: { nextNftItemId: 1 } }
    );

    return result;
  }


  async mapAttributes(attributes) {
    const attributeDtoService = new AttributeDtoService();
    const nftCollectionAttributes = await attributeDtoService.getAttributesByScope('nftCollection');

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

export default NFTCollectionMetadataService;