import mongoose from 'mongoose';
import BaseService from './../../base/BaseService';
// TODO: separate read/write schemas
import ProjectSchema from './../../../schemas/ProjectSchema';
import AttributesService from './../../legacy/attributes';
import { logWarn } from './../../../utils/log';
import { ATTRIBUTE_TYPE, ATTRIBUTE_SCOPE } from './../../../constants';


class ProjectService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(ProjectSchema, options);
  }


  async createProject({
    projectId,
    teamId,
    attributes,
    status
  }) {

    const attributesService = new AttributesService();
    const systemAttributes = await attributesService.getSystemAttributes();
    const teamAttr = systemAttributes.find(attr => attr.scope == ATTRIBUTE_SCOPE.RESEARCH && attr.type == ATTRIBUTE_TYPE.RESEARCH_GROUP);
    if (teamAttr.isHidden) {
      const rAttr = attributes.find(rAttr => rAttr.attributeId === teamAttr._id.toString());
      if (rAttr.value === null) {
        rAttr.value = [teamId];
      }
    }

    const mappedAttributes = await this.mapAttributes(attributes);
    const result = await this.createOne({
      _id: projectId,
      researchGroupExternalId: teamId,
      status: status,
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
    const attributesService = new AttributesService();
    const projectAttributes = await attributesService.getAttributesByScope(ATTRIBUTE_SCOPE.RESEARCH);

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
        case ATTRIBUTE_TYPE.STEPPER: {
          rAttrValue = mongoose.Types.ObjectId(rAttr.value.toString()); // _id
          break;
        }
        case ATTRIBUTE_TYPE.TEXT: {
          rAttrValue = rAttr.value.toString(); // text
          break;
        }
        case ATTRIBUTE_TYPE.TEXTAREA: {
          rAttrValue = rAttr.value.toString(); // text
          break;
        }
        case ATTRIBUTE_TYPE.SELECT: {
          rAttrValue = rAttr.value.map(v => mongoose.Types.ObjectId(v.toString())); // _id
          break;
        }
        case ATTRIBUTE_TYPE.URL: {
          rAttrValue = rAttr.value.map(v => v); // schema
          break;
        }
        case ATTRIBUTE_TYPE.VIDEO_URL: {
          rAttrValue = rAttr.value.toString(); // url
          break;
        }
        case ATTRIBUTE_TYPE.SWITCH: {
          rAttrValue = rAttr.value == true || rAttr.value === 'true';
          break;
        }
        case ATTRIBUTE_TYPE.CHECKBOX: {
          rAttrValue = rAttr.value == true || rAttr.value === 'true';
          break;
        }
        case ATTRIBUTE_TYPE.USER: {
          rAttrValue = rAttr.value.map(v => v.toString()); // username / external_id
          break;
        }
        case ATTRIBUTE_TYPE.DISCIPLINE: {
          rAttrValue = rAttr.value.map(v => v.toString()); // external_id
          break;
        }
        case ATTRIBUTE_TYPE.RESEARCH_GROUP: {
          rAttrValue = rAttr.value.map(v => v.toString()); // external_id
          break;
        }
        case ATTRIBUTE_TYPE.IMAGE: {
          rAttrValue = rAttr.value.toString(); // image name
          break;
        }
        case ATTRIBUTE_TYPE.FILE: {
          rAttrValue = rAttr.value.toString(); // file name
          break;
        }
        case ATTRIBUTE_TYPE.EXPRESS_LICENSING: {
          rAttrValue = rAttr.value.map(v => v); // schema
          break;
        }
        case ATTRIBUTE_TYPE.ROADMAP: {
          rAttrValue = rAttr.value.map(v => v); // schema
          break;
        }
        case ATTRIBUTE_TYPE.PARTNERS: {
          rAttrValue = rAttr.value.map(v => v); // schema
          break;
        }
        default: {
          logWarn(`WARNING: Unknown attribute type ${attribute.type}`);
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

}

export default ProjectService;