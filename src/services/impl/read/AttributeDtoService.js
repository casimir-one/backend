import deipRpc from '@deip/rpc-client';
import AttributeSchema from './../../../schemas/AttributeSchema';
import config from './../../../config';
import TenantSchema from './../../../schemas/TenantSchema';
import { ATTRIBUTE_SCOPE } from '@deip/attributes-service';
import mongoose from 'mongoose';

class AttributeDtoService {
  async getTenantInstance() {
    const tenant = await TenantSchema.findOne({ _id: config.TENANT });
    if (!tenant) {
      throw new Error(`Tenant ${config.TENANT} is not found`);
    }
  
    return tenant.toObject();
  }
  
  async getBaseScopeQuery() {
    const tenant = await this.getTenantInstance();
    if (tenant.network.scope.length) {
      const isAll = tenant.network.scope.some(s => s == 'all'); 
      if (isAll) {
        const tenants = await TenantSchema.find({});
        return { tenantId: { $in: [...tenants.map(t => t._id.toString()), null] } }
      } else {
        return { tenantId: { $in: [...tenant.network.scope, null] } }
      }
    } else {
      return { tenantId: { $in: [tenant._id, null] } }
    }
  }
  
  async mapAttributes(attrs) {
    const tenant = await this.getTenantInstance();
    const attributes = attrs.map(q => q.toObject({minimize: false}));
    return attributes.map((attr) => {
      const overwriteAttr = tenant.settings.attributeOverwrites.find(({_id}) => mongoose.Types.ObjectId(_id).toString() == mongoose.Types.ObjectId(attr._id).toString()) || {};
      return {...attr, ...overwriteAttr}
    })
  }
  
  async getAttributes() {
    const tenant = await this.getTenantInstance();
    const result = await AttributeSchema.find({tenantId: { $in: [tenant._id, null] }});
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }
  
  async getAttributesByScope(scope = ATTRIBUTE_SCOPE.PROJECT) {
    const tenant = await this.getTenantInstance();
    const result = await AttributeSchema.find({ tenantId: { $in: [tenant._id, null] }, scope });
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }
  
  async getNetworkAttributesByScope(scope = ATTRIBUTE_SCOPE.PROJECT) {
    const scopeQuery = await this.getBaseScopeQuery();
    const result = await AttributeSchema.find({...scopeQuery, scope});
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }
  
  async getAttribute(attributeId) {
    const result = await AttributeSchema.findOne({_id: attributeId});
    if (!result) return;
    const mapAttributes = await this.mapAttributes([result]);
    return mapAttributes[0];
  }
  
  async getNetworkAttributes() {
    const scopeQuery = await this.getBaseScopeQuery();
    const result = await AttributeSchema.find({...scopeQuery});
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }
  
  async getSystemAttributes() {
    const result = await AttributeSchema.find({isSystem: true});
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }
}

export default AttributeDtoService;