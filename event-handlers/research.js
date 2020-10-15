import EventEmitter from 'events';
import { APP_EVENTS, RESEARCH_ATTRIBUTE_TYPE, RESEARCH_STATUS, USER_INVITE_STATUS } from './../constants';
import { handle, fire, wait } from './utils';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';
import usersService from './../services/users';


class ResearchHandler extends EventEmitter { }

const researchHandler = new ResearchHandler();

researchHandler.on(APP_EVENTS.RESEARCH_CREATED, (payload, reply) => handle(payload, reply, async (source) => {

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
  
  let hasUpdate = false;
  const researchGroupAttribute = tenant.settings.researchAttributes.find(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUP && attr.blockchainFieldMeta && attr.blockchainFieldMeta.field == 'research_group');
  if (researchGroupAttribute && researchGroupAttribute.isHidden) {
    const rAttr = attributes.find(rAttr => rAttr.researchAttributeId.toString() == researchGroupAttribute._id.toString());
    rAttr.value = researchGroupExternalId;
    hasUpdate = true;
  }

  if (hasUpdate) {
    await researchService.updateResearchRef(researchExternalId, { attributes: attributes });
  }

  const research = await researchService.getResearch(researchExternalId)
  return research;
  
}));



researchHandler.on(APP_EVENTS.RESEARCH_UPDATED, (payload, reply) => handle(payload, reply, async (source) => {

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


researchHandler.on(APP_EVENTS.USER_INVITATION_SIGNED, (payload, reply) => handle(payload, reply, async (event) => {

  const { tenant, researchGroup, invite } = event;

  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();

  if (invite.status == USER_INVITE_STATUS.SENT) {

    const researches = [];
    if (invite.researches) {
      const result = await researchService.getResearches(invite.researches);
      researches.push(...result);
    } else {
      const result = await researchService.getResearchesByResearchGroup(researchGroup.external_id);
      researches.push(...result);
    }

    const promises = [];
    for (let i = 0; i < researches.length; i++) {
      const research = researches[i];

      let hasUpdate = false;

      const multipleMembersAttributes = tenant.settings.researchAttributes.filter(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.USERS_LIST && attr.blockchainFieldMeta && attr.blockchainFieldMeta.field == 'members');
      for (let j = 0; j < multipleMembersAttributes.length; j++) {
        const multipleMembersAttribute = multipleMembersAttributes[j];
        const researchMembersAttribute = research.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() == multipleMembersAttribute._id.toString());

        if (!researchMembersAttribute.value.some(m => m == invite.invitee)) {
          researchMembersAttribute.value.push(invite.invitee);
          hasUpdate = true;
        }
      }
      // refactor this !
      const singleMemberAttributes = tenant.settings.researchAttributes.filter(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.USER && attr.blockchainFieldMeta && attr.blockchainFieldMeta.field == 'members');
      for (let j = 0; j < singleMemberAttributes.length; j++) {
        const singleMembersAttribute = singleMemberAttributes[j];
        const researchMemberAttribute = research.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() == singleMembersAttribute._id.toString());

        if (researchMemberAttribute.value == invite.invitee) {
          hasUpdate = false;
        }
      }

      if (hasUpdate) {
        promises.push(researchService.updateResearchRef(research.external_id, { attributes: research.researchRef.attributes }));
      }
    }

    await Promise.all(promises);
  }

}));


researchHandler.on(APP_EVENTS.USER_INVITATION_CANCELED, (payload, reply) => handle(payload, reply, async (event) => {

  const { tenant, researchGroup, invite } = event;

  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();

  const members = await usersService.findResearchGroupMembershipUsers(researchGroup.external_id);

  if (!members.some(user => user.account.name == invite.invitee)) { // check if rejecting old invite

    const researches = [];
    if (invite.researches) {
      const result = await researchService.getResearches(invite.researches);
      researches.push(...result);
    } else {
      const result = await researchService.getResearchesByResearchGroup(researchGroup.external_id);
      researches.push(...result);
    }

    const promises = [];
    for (let i = 0; i < researches.length; i++) {
      const research = researches[i];

      let hasUpdate = false;

      const multipleMembersAttributes = tenant.settings.researchAttributes.filter(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.USERS_LIST && attr.blockchainFieldMeta && attr.blockchainFieldMeta.field == 'members');
      for (let j = 0; j < multipleMembersAttributes.length; j++) {
        const multipleMembersAttribute = multipleMembersAttributes[j];
        const researchMembersAttribute = research.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() == multipleMembersAttribute._id.toString());
        
        if (researchMembersAttribute.value.some(m => m == invite.invitee)) {
          researchMembersAttribute.value = researchMembersAttribute.value.filter(m => m != invite.invitee);
          hasUpdate = true;
        }
      }

      const singleMemberAttributes = tenant.settings.researchAttributes.filter(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.USER && attr.blockchainFieldMeta && attr.blockchainFieldMeta.field == 'members');
      for (let j = 0; j < singleMemberAttributes.length; j++) {
        const singleMembersAttribute = singleMemberAttributes[j];
        const researchMemberAttribute = research.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() == singleMembersAttribute._id.toString());

        if (researchMemberAttribute.value == invite.invitee) {
          researchMemberAttribute.value = null;
          hasUpdate = true;
        }
      }

      if (hasUpdate) {
        promises.push(researchService.updateResearchRef(research.external_id, { attributes: research.researchRef.attributes }));
      }
    }

    await Promise.all(promises);
  }

}));



researchHandler.on(APP_EVENTS.USER_RESIGNATION_SIGNED, (payload, reply) => handle(payload, reply, async (event) => {

  const { tenant, researchGroup, member } = event;

  const researchService = new ResearchService(tenant);
  const researches = await researchService.getResearchesByResearchGroup(researchGroup.external_id);

  const promises = [];
  for (let i = 0; i < researches.length; i++) {
    const research = researches[i];

    let hasUpdate = false;

    const multipleMembersAttributes = tenant.settings.researchAttributes.filter(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.USERS_LIST && attr.blockchainFieldMeta && attr.blockchainFieldMeta.field == 'members');
    for (let j = 0; j < multipleMembersAttributes.length; j++) {
      const multipleMembersAttribute = multipleMembersAttributes[j];
      const researchMembersAttribute = research.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() == multipleMembersAttribute._id.toString());

      if (researchMembersAttribute.value.some(m => m == member._id)) {
        researchMembersAttribute.value = researchMembersAttribute.value.filter(m => m != member._id);
        hasUpdate = true;
      }
    }

    const singleMemberAttributes = tenant.settings.researchAttributes.filter(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.USER && attr.blockchainFieldMeta && attr.blockchainFieldMeta.field == 'members');
    for (let j = 0; j < singleMemberAttributes.length; j++) {
      const singleMembersAttribute = singleMemberAttributes[j];
      const researchMemberAttribute = research.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() == singleMembersAttribute._id.toString());

      if (researchMemberAttribute.value == member._id) {
        researchMemberAttribute.value = null;
        hasUpdate = true;
      }
    }

    if (hasUpdate) {
      promises.push(researchService.updateResearchRef(research.external_id, { attributes: research.researchRef.attributes }));
    }
  }

  await Promise.all(promises);

}));


export default researchHandler;