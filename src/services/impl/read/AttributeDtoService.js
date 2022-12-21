import AttributeSchema from './../../../schemas/AttributeSchema';
import { AttributeScope } from '@casimir.one/platform-core';
import BaseService from './../../base/BaseService';

class AttributeDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(AttributeSchema, options);
  }
  
  async mapDTOs(attrs) {
    return attrs.map((attr) => {
      return { ...attr }
    })
  }

  async getAttribute(attributeId) {
    const result = await this.findOne({ _id: attributeId });
    if (!result) return;
    const list = await this.mapDTOs([result]);
    return list[0];
  }
  
  async getAttributes() {
    const result = await this.findMany({});
    if (!result.length) return [];
    const list = await this.mapDTOs(result);
    return list;
  }
  
  async getAttributesByScope(scope = AttributeScope.NFT_COLLECTION) {
    const result = await this.findMany({ scope });
    if (!result.length) return [];
    const list = await this.mapDTOs(result);
    return list;
  }
  
}

export default AttributeDtoService;
