import mongoose from 'mongoose';
import BaseService from './../../base/BaseService';
import ProjectSchema from './../../../schemas/ProjectSchema';
import AttributeDtoService from './../read/AttributeDtoService';
import { logWarn } from './../../../utils/log';
import { ATTR_SCOPES, ATTR_TYPES } from '@deip/constants';


class ProjectService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ProjectSchema, options);
  }

  async getProject(projectId) {
    const project = await this.findOne({ _id: projectId });
    return project || null;
  }

  async createProject({
    projectId,
    teamId,
    attributes,
    status,
    isDefault
  }) {

    const attributeDtoService = new AttributeDtoService();
    const systemAttributes = await attributeDtoService.getSystemAttributes();
    const teamAttr = systemAttributes.find(attr => attr.scope == ATTR_SCOPES.PROJECT && attr.type == ATTR_TYPES.TEAM);
    
    // Team attribute is required
    if (!attributes.some(rAttr => rAttr.attributeId === teamAttr._id.toString())) {
      attributes.push({
        attributeId: teamAttr._id.toString(),
        value: [teamId]
      })
    } else if (teamAttr.isHidden) {
      const rAttr = attributes.find(rAttr => rAttr.attributeId === teamAttr._id.toString());
      if (rAttr.value === null) {
        rAttr.value = [teamId];
      }
    }

    const mappedAttributes = await this.mapAttributes(attributes);
    const result = await this.createOne({
      _id: projectId,
      teamId: teamId,
      status: status,
      isDefault: isDefault,
      attributes: mappedAttributes
    })

    return result;
  }


  async updateProject(projectId, { status, attributes }) {

    let mappedAttributes;
    if (attributes) {
      mappedAttributes = await this.mapAttributes(attributes);
    }

    const result = await this.updateOne({ _id: projectId }, {
      status,
      attributes: attributes ? mappedAttributes : undefined
    });

    return result;
  }

  
  async mapAttributes(attributes) {
    const attributeDtoService = new AttributeDtoService();
    const projectAttributes = await attributeDtoService.getAttributesByScope(ATTR_SCOPES.PROJECT);

    return attributes.map(rAttr => {
      const rAttrId = mongoose.Types.ObjectId(rAttr.attributeId.toString());

      const attribute = projectAttributes.find(a => a._id.toString() == rAttrId);
      let rAttrValue = null;

      if (!attribute) {
        console.warn(`WARNING: ${rAttrId} is obsolete attribute`);
      }

      if (!attribute || rAttr.value == null) {
        return {
          attributeId: rAttrId,
          value: rAttrValue
        };
      }

      switch (attribute.type) {
        case ATTR_TYPES.STEPPER: {
          rAttrValue = mongoose.Types.ObjectId(rAttr.value.toString()); // _id
          break;
        }
        case ATTR_TYPES.TEXT: {
          rAttrValue = rAttr.value.toString(); // text
          break;
        }
        case ATTR_TYPES.TEXTAREA: {
          rAttrValue = rAttr.value.toString(); // text
          break;
        }
        case ATTR_TYPES.SELECT: {
          rAttrValue = rAttr.value.map(v => mongoose.Types.ObjectId(v.toString())); // _id
          break;
        }
        case ATTR_TYPES.URL: {
          rAttrValue = rAttr.value.map(v => v); // schema
          break;
        }
        case ATTR_TYPES.VIDEO_URL: {
          rAttrValue = rAttr.value.toString(); // url
          break;
        }
        case ATTR_TYPES.SWITCH: {
          rAttrValue = rAttr.value == true || rAttr.value === 'true';
          break;
        }
        case ATTR_TYPES.CHECKBOX: {
          rAttrValue = rAttr.value == true || rAttr.value === 'true';
          break;
        }
        case ATTR_TYPES.USER: {
          rAttrValue = rAttr.value.map(v => v.toString()); // username / id
          break;
        }
        case ATTR_TYPES.DOMAIN: {
          rAttrValue = rAttr.value.map(v => v.toString()); // id
          break;
        }
        case ATTR_TYPES.TEAM: {
          rAttrValue = rAttr.value.map(v => v.toString()); // id
          break;
        }
        case ATTR_TYPES.IMAGE: {
          rAttrValue = rAttr.value.toString(); // image name
          break;
        }
        case ATTR_TYPES.FILE: {
          rAttrValue = rAttr.value.toString(); // file name
          break;
        }
        case ATTR_TYPES.EXPRESS_LICENSING: {
          rAttrValue = rAttr.value.map(v => v); // schema
          break;
        }
        case ATTR_TYPES.ROADMAP: {
          rAttrValue = rAttr.value.map(v => v); // schema
          break;
        }
        case ATTR_TYPES.PARTNERS: {
          rAttrValue = rAttr.value.map(v => v); // schema
          break;
        }
        default: {
          logWarn(`WARNING: Unhandeled value '${rAttr.value}' for attribute type ${ATTR_TYPES[attribute.type]}`);
          rAttrValue = rAttr.value;
          break;
        }
      }

      return {
        attributeId: rAttrId,
        value: rAttrValue
      }
    })
  }

  async addAttributeToProjects({ attributeId, type, defaultValue }) {
    const result = await this.updateMany({}, { $push: { attributes: { attributeId: mongoose.Types.ObjectId(attributeId), type, value: defaultValue } } });
    return result;
  }


  async removeAttributeFromProjects({ attributeId }) {
    const result = await this.updateMany({}, { $pull: { attributes: { attributeId: mongoose.Types.ObjectId(attributeId) } } });
    return result;
  }


  async updateAttributeInProjects({ attributeId, type, valueOptions, defaultValue }) {
    if (type == ATTR_TYPES.STEPPER || type == ATTR_TYPES.SELECT) {
      const result = await this.updateMany(
        {
          $and: [
            { 'attributes.attributeId': mongoose.Types.ObjectId(attributeId) },
            { 'attributes.value': { $nin: [...valueOptions.map(opt => mongoose.Types.ObjectId(opt.value))] } }
          ]
        },
        { $set: { 'attributes.$.value': defaultValue } }
      );

      return result;
    } else {
      return Promise.resolve();
    }
  }

}

export default ProjectService;