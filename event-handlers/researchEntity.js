import EventEmitter from 'events';
import { APP_EVENTS, RESEARCH_ATTRIBUTE_TYPE, RESEARCH_STATUS } from './../constants';
import { handle, fire, wait } from './utils';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';
import usersService from './../services/users';


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



researchEntityHandler.on(APP_EVENTS.RESEARCH_UPDATED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, tenant, context: { emitter, offchainMeta: { attributes } } } = source;
  const [opName, opPayload] = opDatum;
  const { external_id: researchExternalId, research_group: researchGroupExternalId } = opPayload;
  
  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();

  if (attributes) {
    await researchService.updateResearchRef(researchExternalId, { attributes });
  }

  const updatedResearch = await researchService.getResearch(researchExternalId)
  return updatedResearch;

}));


researchEntityHandler.on(APP_EVENTS.USER_INVITATION_CANCELED, (payload, reply) => handle(payload, reply, async (event) => {

  const { tenant, researchGroup, invite } = event;

  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();

  const members = await usersService.findResearchGroupMembershipUsers(researchGroup.external_id);

  const promises = [];

  if (!members.some(user => user.account.name == invite.invitee)) {

    const researches = [];
    if (invite.researches) {
      const result = await researchService.getResearches(invite.researches);
      researches.push(...result);
    } else {
      const result = await researchService.getResearchesByResearchGroup(researchGroup.external_id);
      researches.push(...result);
    }

    for (let i = 0; i < researches.length; i++) {
      const research = researches[i];

      const membersAttributes = tenant.settings.researchAttributes.filter(attr => attr.blockchainFieldMeta && attr.blockchainFieldMeta.field == 'members');
      const researchMembersAttributes = research.researchRef.attributes.filter(rAttr => membersAttributes.some(attr => rAttr.researchAttributeId.toString() == attr._id.toString()));

      for (let j = 0; j < researchMembersAttributes.length; j++) {
        const rAttr = researchMembersAttributes[j];

        if (rAttr.value && Array.isArray(rAttr.value)) {
          rAttr.value = rAttr.value.filter(m => m != invite.invitee);
        } else {
          rAttr.value = null;
        }
      }

      promises.push(researchService.updateResearchRef(research.external_id, { attributes: research.researchRef.attributes }));
    }
  }

  await Promise.all(promises);

}));



export default researchEntityHandler;