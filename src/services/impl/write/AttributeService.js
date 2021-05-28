import deipRpc from '@deip/rpc-client';
import BaseService from './../../base/BaseService';
import AttributeSchema from './../../../schemas/AttributeSchema';
import mongoose from 'mongoose';
import TenantSchema from './../../../schemas/TenantSchema';

class AttributeService extends BaseService {

  constructor() { 
    super(AttributeSchema);
  }

  async createAttribute(tenantExternalId, {
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
    schemas,
    isEditable,
    isRequired,
    scope
  }) {
    const newAttribute = new AttributeSchema({
      _id: mongoose.Types.ObjectId(),
      type,
      isPublished,
      isFilterable,
      isHidden,
      isMultiple,
      title,
      shortTitle,
      description,
      scope,
      schemas,
      isEditable,
      isRequired,
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
    isEditable,
    isRequired,
    schemas,
    scope
  }) {
    if(isSystem) {
      const tenantProfile = await TenantSchema.findOne({ _id: tenantId });

      const tenantProfileObj = tenantProfile.toObject();

      const attribute = tenantProfileObj.settings.attributeOverwrites.find(a => a._id.toString() === mongoose.Types.ObjectId(attributeId).toString()) || {};
      attribute._id = mongoose.Types.ObjectId(attributeId);
      attribute.isFilterable = isFilterable;
      attribute.isHidden = isHidden;
      attribute.title = title;
      attribute.scope = scope;
      attribute.schemas = schemas;
      attribute.shortTitle = shortTitle;
      attribute.description = description;
      attribute.defaultValue = defaultValue;
      attribute.isEditable = isEditable;
      attribute.isRequired = isRequired;

      if(!tenantProfileObj.settings.attributeOverwrites.some((attr) => attributeId === attr._id.toString())) {
        tenantProfile.settings.attributeOverwrites.push(attribute)
      } else {
        tenantProfile.settings.attributeOverwrites = [
          ...tenantProfileObj.settings.attributeOverwrites.filter(a => a._id.toString() !== attributeId),
          attribute
        ]
      }

      const savedTenantProfile = await tenantProfile.save();
      return savedTenantProfile.toObject();
    } else {
      const attribute = await AttributeSchema.findOne({ _id: attributeId })
      attribute.type = type;
      attribute.isPublished = isPublished;
      attribute.isFilterable = isFilterable;
      attribute.isHidden = isHidden;
      attribute.isMultiple = isMultiple;
      attribute.title = title;
      attribute.scope = scope;
      attribute.schemas = schemas;
      attribute.shortTitle = shortTitle;
      attribute.description = description;
      attribute.valueOptions = valueOptions.map(opt => {
        return { ...opt, value: opt.value ? mongoose.Types.ObjectId(opt.value.toString()) : mongoose.Types.ObjectId() };
      });
      attribute.defaultValue = defaultValue;
      attribute.isEditable = isEditable;
      attribute.isRequired = isRequired;

      const savedAttribute = await attribute.save();
      return savedAttribute.toObject();
    }
  }

  async deleteAttribute(tenantId, {
    _id: attributeId,
  }) {
    const deletedAttr = await AttributeSchema.deleteOne({ _id: attributeId, tenantId, isSystem: false });
    return deletedAttr;
  }
}

export default AttributeService;