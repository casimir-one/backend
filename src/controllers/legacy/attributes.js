import AttributesService from './../../services/legacy/attributes';
import mongoose from 'mongoose';
import ResearchService from './../../services/impl/read/ProjectDtoService';

const getAttributes = async (ctx) => {
  try {
    const attributesService = new AttributesService();
    const attributes = await attributesService.getAttributes();
    ctx.status = 200
    ctx.body = attributes;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getAttributesByScope = async (ctx) => {
  const scope = ctx.params.scope;
  try {
    const attributesService = new AttributesService();
    const attributes = await attributesService.getAttributesByScope(scope);
    ctx.status = 200
    ctx.body = attributes;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}
const getNetworkAttributesByScope = async (ctx) => {
  const scope = ctx.params.scope;
  try {
    const attributesService = new AttributesService();
    const attributes = await attributesService.getNetworkAttributesByScope(scope);
    ctx.status = 200
    ctx.body = attributes;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}
const getAttribute = async (ctx) => {
  const attributeId = ctx.params.id;
  try {
    const attributesService = new AttributesService();
    const attributes = await attributesService.getAttributes(attributeId);
    ctx.status = 200
    ctx.body = attributes;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getNetworkAttributes = async (ctx) => {
  try {
    const attributesService = new AttributesService();
    const attributes = await attributesService.getNetworkAttributes();
    ctx.status = 200
    ctx.body = attributes;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getSystemAttributes = async (ctx) => {
  try {
    const attributesService = new AttributesService();
    const attributes = await attributesService.getSystemAttributes();
    ctx.status = 200
    ctx.body = attributes;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const createAttribute = async (ctx) => {
  const tenant = ctx.state.tenant;
  const attribute = ctx.request.body;

  try {
    const attributesService = new AttributesService();

    const attributeId = mongoose.Types.ObjectId();
    const newAttribute = await attributesService.createAttribute(tenant.id, { ...attribute, _id: attributeId.toString() });
    ctx.status = 200;
    ctx.body = newAttribute;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const updateAttribute = async (ctx) => {
  const tenant = ctx.state.tenant;
  const attribute = ctx.request.body;

  try {
    const attributesService = new AttributesService();
    const researchService = new ResearchService();

    const updatedResearchAttr = await attributesService.updateAttribute(tenant.id, { ...attribute });
    
    await researchService.updateAttributeInResearches({
      attributeId: attribute._id,
      type: attribute.type,
      valueOptions: attribute.valueOptions,
      defaultValue: attribute.defaultValue || null
    });

    ctx.status = 200;
    ctx.body = updatedResearchAttr;
  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}
const deleteAttribute = async (ctx) => {
  const tenant = ctx.state.tenant;
  const attributeId = ctx.params.id;

  try {
    const attributesService = new AttributesService();
    const researchService = new ResearchService();

    const deletedAttr = await attributesService.deleteAttribute(tenant.id, { _id: attributeId });

    await researchService.removeAttributeFromResearches({
      attributeId
    });

    ctx.status = 200;
    ctx.body = deletedAttr;

  } catch (err) {
    console.error(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

export default {
  getAttributes,
  getAttributesByScope,
  getNetworkAttributesByScope,
  getAttribute,
  getSystemAttributes,
  getNetworkAttributes,
  createAttribute,
  updateAttribute,
  deleteAttribute
}
