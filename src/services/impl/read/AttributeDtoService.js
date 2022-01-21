import AttributeSchema from './../../../schemas/AttributeSchema';
// import { ATTR_SCOPES } from '@deip/constants';
import { ATTR_SCOPES } from './../../../constants'; //temp
import mongoose from 'mongoose';
import BaseService from './../../base/BaseService';

class AttributeDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(AttributeSchema, options);
  }
  
  async mapAttributes(attrs) {
    const portal = await this.getPortalInstance();
    return attrs.map((attr) => {
      const overwriteAttr = portal.settings.attributeOverwrites.find(({_id}) => mongoose.Types.ObjectId(_id).toString() == mongoose.Types.ObjectId(attr._id).toString()) || {};
      return {...attr, ...overwriteAttr}
    })
  }
  
  async getAttributes() {
    const result = await this.findMany({});
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }
  
  async getAttributesByScope(scope = ATTR_SCOPES.PROJECT) {
    const result = await this.findMany({ scope });
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }
  
  async getNetworkAttributesByScope(scope = ATTR_SCOPES.PROJECT) {
    const result = await this.findMany({ scope })
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }
  
  async getAttribute(attributeId) {
    const result = await this.findOne({ _id: attributeId });
    if (!result) return;
    const mapAttributes = await this.mapAttributes([result]);
    return mapAttributes[0];
  }
  
  async getNetworkAttributes() {
    const result = await this.findMany({});
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }
  
  async getSystemAttributes() {
    const result = await this.findMany({ isSystem: true });
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }
}

export default AttributeDtoService;
