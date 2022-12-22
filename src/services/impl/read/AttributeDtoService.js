import AttributeSchema from './../../../schemas/AttributeSchema';
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

  async getAttributesDTOsPaginated(filter, sort, pagination) {
    const f = filter || {};
    const { paginationMeta, result: nftItems } = await this.findManyPaginated(f, sort, pagination);
    const result = await this.mapDTOs(nftItems);
    return { paginationMeta, result };
  }

}

export default AttributeDtoService;
