import BaseService from './../../base/BaseService';
import AttributeSchema from './../../../schemas/AttributeSchema';
import mongoose from 'mongoose';
import PortalSchema from './../../../schemas/PortalSchema';

class AttributeService extends BaseService {

  constructor() { 
    super(AttributeSchema);
  }

  async createAttribute(portalId, {
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
      portalId
    })
    const savedAttribute = await newAttribute.save();
    return savedAttribute.toObject();
  }

  async updateAttribute({
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
    isEditable,
    isRequired,
    schemas,
    scope
  }) {

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

  async deleteAttribute(portalId, {
    _id: attributeId,
  }) {
    const deletedAttr = await AttributeSchema.deleteOne({ _id: attributeId, portalId, isSystem: false });
    return deletedAttr;
  }
}

export default AttributeService;