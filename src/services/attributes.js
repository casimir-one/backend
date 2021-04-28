import Attribute from '../schemas/attribute';
import config from './../config';
import TenantProfile from './../schemas/tenant';
import mongoose from 'mongoose';
import { ATTRIBUTE_SCOPE } from './../constants';

class AttributesService{
  async getTenantInstance() {
    const tenant = await TenantProfile.findOne({ _id: config.TENANT });
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
        const tenants = await TenantProfile.find({});
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
    const attributes = attrs.map(q => q.toObject());
    return attributes.map((attr) => {
      const overwriteAttr = tenant.settings.attributeOverwrites.find(({_id}) => mongoose.Types.ObjectId(_id).toString() == mongoose.Types.ObjectId(attr._id).toString()) || {};
      return {...attr, ...overwriteAttr}
    })
  }

  async getAttributes() {
    const tenant = await this.getTenantInstance();
    const result = await Attribute.find({tenantId: { $in: [tenant._id, null] }});
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }

  async getAttributesByScope(scope = ATTRIBUTE_SCOPE.RESEARCH) {
    const tenant = await this.getTenantInstance();
    const result = await Attribute.find({ tenantId: { $in: [tenant._id, null] }, scope });
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }

  async getNetworkAttributesByScope(scope = ATTRIBUTE_SCOPE.RESEARCH) {
    const scopeQuery = await this.getBaseScopeQuery();
    const result = await Attribute.find({...scopeQuery, scope});
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }

  async getAttribute(attributeId) {
    const result = await Attribute.findOne({_id: attributeId});
    if (!result) return;
    const mapAttributes = await this.mapAttributes([result]);
    return mapAttributes[0];
  }

  async getNetworkAttributes() {
    const scopeQuery = await this.getBaseScopeQuery();
    const result = await Attribute.find({...scopeQuery});
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }

  async getSystemAttributes() {
    const result = await Attribute.find({isSystem: true});
    if (!result.length) return [];
    const mapAttributes = await this.mapAttributes(result);
    return mapAttributes;
  }

  async createAttribute(tenantExternalId, {
    _id: attributeId,
    type,
    isPublished,
    isFilterable,
    isHidden,
    isMultiple,
    title,
    shortTitle,
    description,
    valueOptions,
    defaultValue,
    scope
  }) {
    const newAttribute = new Attribute({
      _id: mongoose.Types.ObjectId(attributeId),
      type,
      isPublished,
      isFilterable,
      isHidden,
      isMultiple,
      title,
      shortTitle,
      description,
      scope,
      valueOptions: valueOptions.map(opt => {
        return { ...opt, value: mongoose.Types.ObjectId() };
      }),
      defaultValue,
      isSystem: false,
      tenantId: tenantExternalId
    })
    const savedAttribute = await newAttribute.save();
    
    return savedAttribute.toObject();
  }

  async updateAttribute(tenantId, {
    _id: attributeId,
    type,
    isPublished,
    isFilterable,
    isHidden,
    isMultiple,
    title,
    shortTitle,
    description,
    valueOptions,
    defaultValue,
    isSystem,
    scope
  }) {
    if(isSystem) {
      const tenantProfile = await TenantProfile.findOne({ _id: tenantId });

      const attribute = tenantProfile.settings.attributeOverwrites.find(a => a._id.toString() === mongoose.Types.ObjectId(attributeId).toString()) || {};
      attribute._id = mongoose.Types.ObjectId(attributeId);
      attribute.isFilterable = isFilterable;
      attribute.isHidden = isHidden;
      attribute.title = title;
      attribute.scope = scope;
      attribute.shortTitle = shortTitle;
      attribute.description = description;
      attribute.defaultValue = defaultValue;

      if(!tenantProfile.settings.attributeOverwrites.some((attr) => attributeId === attr._id)) {
        tenantProfile.settings.attributeOverwrites.push(attribute)
      }

      const savedTenantProfile = await tenantProfile.save();
      return savedTenantProfile.toObject();
    } else {
      const attribute = await Attribute.findOne({ _id: attributeId })
      attribute.type = type;
      attribute.isPublished = isPublished;
      attribute.isFilterable = isFilterable;
      attribute.isHidden = isHidden;
      attribute.isMultiple = isMultiple;
      attribute.title = title;
      attribute.scope = scope;
      attribute.shortTitle = shortTitle;
      attribute.description = description;
      attribute.valueOptions = valueOptions.map(opt => {
        return { ...opt, value: opt.value ? mongoose.Types.ObjectId(opt.value.toString()) : mongoose.Types.ObjectId() };
      });
      attribute.defaultValue = defaultValue;

      const savedAttribute = await attribute.save();
      return savedAttribute.toObject();
    }
  }

  async deleteAttribute(tenantId, {
    _id: attributeId,
  }) {
    const deletedAttr = await Attribute.deleteOne({ _id: attributeId, tenantId, isSystem: false });
    return deletedAttr;
  }
}

export default AttributesService;