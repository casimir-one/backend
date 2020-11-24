import EventEmitter from 'events';
import { APP_EVENTS, PROPOSAL_STATUS, SMART_CONTRACT_TYPE, RESEARCH_ATTRIBUTE_TYPE, RESEARCH_STATUS, USER_INVITE_STATUS } from './../constants';
import { handle, fire, wait } from './utils';
import ResearchService from './../services/research';
import ProposalService from './../services/proposal';
import ResearchGroupService from './../services/researchGroup';
import usersService from './../services/users';
import UserInviteService from './../services/userInvites';


class ResearchHandler extends EventEmitter { }

const researchHandler = new ResearchHandler();

researchHandler.on(APP_EVENTS.RESEARCH_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchCreatedEvent, tenant } = source;

  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();
  const { researchExternalId, researchGroupExternalId, attributes } = researchCreatedEvent.getSourceData();

  const researchRef = await researchService.createResearchRef({
    externalId: researchExternalId,
    researchGroupExternalId: researchGroupExternalId,
    attributes: attributes,
    status: RESEARCH_STATUS.APPROVED
  });
  
  let hasUpdate = false;
  const researchGroupAttribute = tenant.settings.researchAttributes.find(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUP && attr.blockchainFieldMeta && attr.blockchainFieldMeta.field == 'research_group');
  if (researchGroupAttribute && researchGroupAttribute.isHidden) {
    const rAttr = attributes.find(rAttr => rAttr.researchAttributeId.toString() == researchGroupAttribute._id.toString());
    if (!rAttr.value) {
      rAttr.value = [researchGroupExternalId];
      hasUpdate = true;
    }
  }

  if (hasUpdate) {
    await researchService.updateResearchRef(researchExternalId, { attributes: attributes });
  }

  const research = await researchService.getResearch(researchExternalId)
  return research;
  
}));


researchHandler.on(APP_EVENTS.RESEARCH_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchProposedEvent, tenant } = source;

  const researchGroupService = new ResearchGroupService();
  const researchService = new ResearchService(tenant);

  const { researchExternalId, researchGroupExternalId, attributes } = researchProposedEvent.getSourceData();

  const researchRef = await researchService.createResearchRef({
    externalId: researchExternalId,
    researchGroupExternalId: researchGroupExternalId,
    attributes: attributes,
    status: RESEARCH_STATUS.PROPOSED
  });

  let hasUpdate = false;
  const researchGroupAttribute = tenant.settings.researchAttributes.find(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUP && attr.blockchainFieldMeta && attr.blockchainFieldMeta.field == 'research_group');
  if (researchGroupAttribute && researchGroupAttribute.isHidden) {
    const rAttr = attributes.find(rAttr => rAttr.researchAttributeId.toString() == researchGroupAttribute._id.toString());
    if (!rAttr.value) {
      rAttr.value = [researchGroupExternalId];
      hasUpdate = true;
    }
  }

  if (hasUpdate) {
    await researchService.updateResearchRef(researchExternalId, { attributes: attributes });
  }

  return researchRef;
}));


researchHandler.on(APP_EVENTS.RESEARCH_UPDATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchUpdatedEvent, tenant } = source;
  
  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();

  const { researchExternalId, researchGroupExternalId, attributes } = researchUpdatedEvent.getSourceData();

  if (attributes) {
    await researchService.updateResearchRef(researchExternalId, { attributes });
  }

  const updatedResearch = await researchService.getResearch(researchExternalId)
  return updatedResearch;
}));


researchHandler.on(APP_EVENTS.RESEARCH_UPDATE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchUpdateProposedEvent, tenant } = source;

  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();

  const { researchExternalId } = researchUpdateProposedEvent.getSourceData();
  const updatedResearch = await researchService.getResearch(researchExternalId)
  return updatedResearch;
}));


researchHandler.on(APP_EVENTS.RESEARCH_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchProposalSignedEvent, tenant } = source;

  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();
  const proposalsService = new ProposalService(usersService, researchGroupService, researchService);

  const proposalId = researchProposalSignedEvent.getProposalId();

  const proposal = await proposalsService.getProposal(proposalId);
  const { status } = proposal.proposal;
  const { researchExternalId, attributes } = proposal.details;

  if (status == PROPOSAL_STATUS.APPROVED) {
    await researchService.updateResearchRef(researchExternalId, {
      status: RESEARCH_STATUS.APPROVED,
      attributes: attributes
    });
  }

  const updatedResearch = await researchService.getResearch(researchExternalId);
  return updatedResearch;
}));


researchHandler.on(APP_EVENTS.RESEARCH_UPDATE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchUpdateProposalSignedEvent, tenant } = source;

  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();
  const proposalsService = new ProposalService(usersService, researchGroupService, researchService);

  const proposalId = researchUpdateProposalSignedEvent.getProposalId();

  const proposal = await proposalsService.getProposal(proposalId);
  const { status } = proposal.proposal;
  const { researchExternalId, attributes } = proposal.details;

  if (status == PROPOSAL_STATUS.APPROVED) {
    await researchService.updateResearchRef(researchExternalId, {
      attributes: attributes
    });
  }

  const updatedResearch = await researchService.getResearch(researchExternalId);
  return updatedResearch;
}));


researchHandler.on(APP_EVENTS.USER_INVITATION_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (event) => {
  const { event: userInvitationProposalSignedEvent, tenant } = event;

  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();
  const userInviteService = new UserInviteService();

  const proposalId = userInvitationProposalSignedEvent.getProposalId();
  const invite = await userInviteService.findUserInvite(proposalId);

  if (invite.status == USER_INVITE_STATUS.SENT) {

    const researches = [];
    if (invite.researches != null) {
      const result = await researchService.getResearches(invite.researches.map(r => r.externalId));
      researches.push(...result);
    }

    const promises = [];
    for (let i = 0; i < researches.length; i++) {
      const research = researches[i];
      const researchInvite = invite.researches.find(r => r.externalId == research.external_id);

      let hasUpdate = false;

      if (researchInvite) {
        for (let j = 0; j < researchInvite.attributes.length; j++) {
          const researchAttributeId = researchInvite.attributes[j];
          const rAttr = research.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() == researchAttributeId.toString());
          if (!rAttr.value.some(m => m == invite.invitee)) {
            rAttr.value.push(invite.invitee);
            hasUpdate = true;
          }
        }
      }

      if (hasUpdate) {
        promises.push(researchService.updateResearchRef(research.external_id, { attributes: research.researchRef.attributes }));
      }
    }

    await Promise.all(promises);
  }

}));


researchHandler.on(APP_EVENTS.USER_INVITATION_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (event) => {
  const { event: userInvitationProposalRejectedEvent, tenant } = event;

  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();
  const proposalsService = new ProposalService(usersService, researchGroupService, researchService);
  const userInviteService = new UserInviteService();

  const proposalId = userInvitationProposalRejectedEvent.getProposalId();
  const invite = await userInviteService.findUserInvite(proposalId);
  const members = await usersService.findResearchGroupMembershipUsers(invite.researchGroupExternalId);

  if (!members.some(user => user.account.name == invite.invitee)) { // check if rejecting old invite

    const researches = [];
    if (invite.researches != null) {
      const result = await researchService.getResearches(invite.researches.map(r => r.externalId));
      researches.push(...result);
    }

    const promises = [];
    for (let i = 0; i < researches.length; i++) {
      const research = researches[i];

      let hasUpdate = false;
      
      const researchInvite = invite.researches.find(r => r.externalId == research.external_id);

      if (researchInvite) {
        for (let j = 0; j < researchInvite.attributes.length; j++) {
          const researchAttributeId = researchInvite.attributes[j];
          const rAttr = research.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() == researchAttributeId.toString());
          if (rAttr.value.some(m => m == invite.invitee)) {
            rAttr.value = rAttr.value.filter(m => m != invite.invitee);
            hasUpdate = true;
          }
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

    const membersAttributes = tenant.settings.researchAttributes.filter(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.USER);
    for (let j = 0; j < membersAttributes.length; j++) {
      const membersAttribute = membersAttributes[j];
      const rAttr = research.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() == membersAttribute._id.toString());

      if (rAttr.value.some(m => m == member._id)) {
        rAttr.value = rAttr.value.filter(m => m != member._id);
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