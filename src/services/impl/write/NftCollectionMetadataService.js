import mongoose from 'mongoose';
import BaseService from '../../base/BaseService';
import NftCollectionMetadataSchema from '../../../schemas/NftCollectionMetadataSchema';
import AttributeDtoService from '../read/AttributeDtoService';
import { logWarn } from '../../../utils/log';
import { ATTR_SCOPES, ATTR_TYPES } from '@deip/constants';
import { isArray } from '@deip/toolbox';


class NftCollectionMetadataService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(NftCollectionMetadataSchema, options);
  }

  async getNftCollectionMetadata(nftCollectionId) {
    const nftCollection = await this.findOne({ _id: nftCollectionId });
    return nftCollection || null;
  }

  async getNftCollectionMetadatas(nftCollectionIds) {
    const nftCollection = await this.findMany({ _id: { $in: [...nftCollectionIds] } });
    return nftCollection || null;
  }

  async createNftCollectionMetadata({
    _id,
    issuer,
    attributes = [],
    isDefault,
    issuedByTeam
  }) {
    const mappedAttributes = await this.mapAttributes(attributes);
    const result = await this.createOne({
      _id,
      issuer,
      isDefault,
      attributes: mappedAttributes,
      issuedByTeam
    })

    return result;
  }


  async updateNftCollectionMetadata({
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
    const nftCollectionAttributes = await attributeDtoService.getAttributesByScope(ATTR_SCOPES.NFT_COLLECTION || 'nftCollection');

    return attributes.map(rAttr => {
      const rAttrId = mongoose.Types.ObjectId(rAttr.attributeId.toString());

      const attribute = nftCollectionAttributes.find(a => a._id.toString() == rAttrId);
      let rAttrValue = null;

      if (!attribute) {
        console.warn(`WARNING: ${rAttrId} is obsolete attribute`);
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

export default NftCollectionMetadataService;