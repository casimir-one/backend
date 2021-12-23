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

  async updateAttribute(portalId, {
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
      const portalProfile = await PortalSchema.findOne({ _id: portalId });

      const portalProfileObj = portalProfile.toObject();

      const attribute = portalProfileObj.settings.attributeOverwrites.find(a => a._id.toString() === mongoose.Types.ObjectId(attributeId).toString()) || {};
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

      if(!portalProfileObj.settings.attributeOverwrites.some((attr) => attributeId === attr._id.toString())) {
        portalProfile.settings.attributeOverwrites.push(attribute)
      } else {
        portalProfile.settings.attributeOverwrites = [
          ...portalProfileObj.settings.attributeOverwrites.filter(a => a._id.toString() !== attributeId),
          attribute
        ]
      }

      const savedPortalProfile = await portalProfile.save();
      return savedPortalProfile.toObject();
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

  async deleteAttribute(portalId, {
    _id: attributeId,
  }) {
    const deletedAttr = await AttributeSchema.deleteOne({ _id: attributeId, portalId, isSystem: false });
    return deletedAttr;
  }
}

export default AttributeService;