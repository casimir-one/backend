import AttributeSchema from './../../../schemas/AttributeSchema';
import { AttributeScope } from '@casimir.one/platform-core';
import BaseService from './../../base/BaseService';

class AttributeDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(AttributeSchema, options);
  }
  
  async mapAttributes(attrs) {
    return attrs.map((attr) => {
      return { ...attr }
    })
  }

  async getAttribute(attributeId) {
    const result = await this.findOne({ _id: attributeId });
    if (!result) return;
    const mapAttributes = await this.mapAttributes([result]);
    return mapAttributes[0];
  }
  
  async getAttributes() {
    const result = await this.findMany({});
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }
  
  async getAttributesByScope(scope = AttributeScope.NFT_COLLECTION) {
    const result = await this.findMany({ scope });
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }
  
}

export default AttributeDtoService;
