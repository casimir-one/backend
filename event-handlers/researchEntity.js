import EventEmitter from 'events';
import { APP_EVENTS, RESEARCH_ATTRIBUTE_TYPE, RESEARCH_STATUS } from './../constants';
import { handle, fire, wait } from './utils';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';


class ResearchEntityHandler extends EventEmitter { }

const researchEntityHandler = new ResearchEntityHandler();

researchEntityHandler.on(APP_EVENTS.RESEARCH_CREATED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, tenant, context: { emitter, offchainMeta: { attributes } } } = source;
  const [opName, opPayload] = opDatum;
  const { external_id: researchExternalId, research_group: researchGroupExternalId } = opPayload;
  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();

  const researchRef = await researchService.findResearchRef(researchExternalId);

  if (!researchRef) {
    await researchService.createResearchRef({
      externalId: researchExternalId,
      researchGroupExternalId: researchGroupExternalId,
      attributes: attributes,
      status: RESEARCH_STATUS.APPROVED
    });
  } else {
    await researchService.updateResearchRef(researchExternalId, {
      status: RESEARCH_STATUS.APPROVED
    });
  }
  
  const hiddenAttributes = tenant.settings.researchAttributes.filter(attr => attr.isHidden);
  const researchHiddenAttributes = attributes.filter(rAttr => hiddenAttributes.some(attr => rAttr.researchAttributeId.toString() == attr._id.toString()));

  let hasUpdate = false;
  for (let i = 0; i < researchHiddenAttributes.length; i++) {
    let rAttr = researchHiddenAttributes[i];
    let attribute = tenant.settings.researchAttributes.find(attr => rAttr.researchAttributeId.toString() == attr._id.toString());
    
    if (rAttr.value == null && attribute.isRequired && attribute.blockchainFieldMeta) {
      if (attribute.type == RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUP) {
        rAttr.value = researchGroupExternalId;
        hasUpdate = true;
      }
    }
  }

  if (hasUpdate){
    await researchService.updateResearchRef(researchExternalId, { attributes: attributes });
  }

  const research = await researchService.getResearch(researchExternalId)
  return research;
  
}));




export default researchEntityHandler;