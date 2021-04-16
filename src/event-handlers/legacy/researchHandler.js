import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { APP_EVENTS, PROPOSAL_STATUS, RESEARCH_ATTRIBUTE_TYPE, RESEARCH_STATUS, USER_INVITE_STATUS, RESEARCH_ATTRIBUTE, TOKEN_SALE_STATUS, ATTRIBUTE_SCOPE } from './../../constants';
import { handle, fire, wait } from './utils';
import ResearchService from './../../services/research';
import ProposalService from './../../services/proposal';
import ResearchGroupService from './../../services/researchGroup';
import UserService from './../../services/users';
import UserInviteService from './../../services/userInvites';
import AttributesService from './../../services/attributes'


class ResearchHandler extends EventEmitter { }

const researchHandler = new ResearchHandler();

researchHandler.on(APP_EVENTS.RESEARCH_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchCreatedEvent, tenant } = source;

  const researchService = new ResearchService();
  const researchGroupService = new ResearchGroupService();
  const attributesService = new AttributesService();

  const { researchExternalId, researchGroupExternalId, source: { offchain: { attributes } } } = researchCreatedEvent.getSourceData();

  const researchAttributes = await attributesService.getAttributesByScope(ATTRIBUTE_SCOPE.RESEARCH);

  const researchRef = await researchService.createResearchRef({
    externalId: researchExternalId,
    researchGroupExternalId: researchGroupExternalId,
    attributes: attributes,
    status: RESEARCH_STATUS.APPROVED
  });
  
  let hasUpdate = false;
  const researchGroupAttribute = researchAttributes.find(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUP && attr.blockchainFieldMeta && attr.blockchainFieldMeta.field == 'research_group');
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
  const researchService = new ResearchService();
  const attributesService = new AttributesService();

  const { researchExternalId, researchGroupExternalId, source: { offchain: { attributes } } } = researchProposedEvent.getSourceData();

  const researchAttributes = await attributesService.getAttributesByScope(ATTRIBUTE_SCOPE.RESEARCH);

  const researchRef = await researchService.createResearchRef({
    externalId: researchExternalId,
    researchGroupExternalId: researchGroupExternalId,
    attributes: attributes,
    status: RESEARCH_STATUS.PROPOSED
  });

  let hasUpdate = false;
  const researchGroupAttribute = researchAttributes.find(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.RESEARCH_GROUP && attr.blockchainFieldMeta && attr.blockchainFieldMeta.field == 'research_group');
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
  const { event: researchUpdatedEvent } = source;
  
  const researchService = new ResearchService();
  const { researchExternalId, source: { offchain: { attributes } } } = researchUpdatedEvent.getSourceData();

  if (attributes) {
    await researchService.updateResearchRef(researchExternalId, { attributes });
  }

  const updatedResearch = await researchService.getResearch(researchExternalId)
  return updatedResearch;
}));


researchHandler.on(APP_EVENTS.RESEARCH_UPDATE_PROPOSED, (payload, reply) => handle(payload, reply, async ({ event: researchUpdateProposedEvent }) => {
  const researchService = new ResearchService();
  const { researchExternalId } = researchUpdateProposedEvent.getSourceData();
  const updatedResearch = await researchService.getResearch(researchExternalId)
  return updatedResearch;
}));


researchHandler.on(APP_EVENTS.RESEARCH_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchProposalSignedEvent } = source;

  const researchService = new ResearchService();
  const proposalsService = new ProposalService();

  const proposalId = researchProposalSignedEvent.getProposalId();

  const proposal = await proposalsService.getProposal(proposalId);
  const { status } = proposal.proposal;
  const { researchExternalId, source: { offchain: { attributes } } } = proposal.details;

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
  const { event: researchUpdateProposalSignedEvent } = source;

  const researchService = new ResearchService();
  const proposalsService = new ProposalService();

  const proposalId = researchUpdateProposalSignedEvent.getProposalId();

  const proposal = await proposalsService.getProposal(proposalId);
  const { status } = proposal.proposal;
  const { researchExternalId, source: { offchain: { attributes } } } = proposal.details;

  if (status == PROPOSAL_STATUS.APPROVED) {
    await researchService.updateResearchRef(researchExternalId, {
      attributes: attributes
    });
  }

  const updatedResearch = await researchService.getResearch(researchExternalId);
  return updatedResearch;
}));


researchHandler.on(APP_EVENTS.USER_INVITATION_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (event) => {
  const { event: userInvitationProposalSignedEvent } = event;

  const researchService = new ResearchService();
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
  const { event: userInvitationProposalRejectedEvent } = event;

  const usersService = new UserService();
  const researchService = new ResearchService();
  const userInviteService = new UserInviteService();

  const proposalId = userInvitationProposalRejectedEvent.getProposalId();
  const invite = await userInviteService.findUserInvite(proposalId);
  const members = await usersService.getUsersByResearchGroup(invite.researchGroupExternalId);

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



researchHandler.on(APP_EVENTS.USER_RESIGNATION_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (event) => {
  const { event: userResignationProposalSignedEvent, tenant } = event;

  const researchService = new ResearchService();
  const proposalsService = new ProposalService();
  const attributesService = new AttributesService();

  const proposalId = userResignationProposalSignedEvent.getProposalId();
  const proposal = await proposalsService.getProposal(proposalId);
  const { member, researchGroupExternalId } = proposal.details;

  const researchAttributes = await attributesService.getAttributesByScope(ATTRIBUTE_SCOPE.RESEARCH);

  const researches = await researchService.getResearchesByResearchGroup(researchGroupExternalId);

  const promises = [];
  for (let i = 0; i < researches.length; i++) {
    const research = researches[i];

    let hasUpdate = false;

    const membersAttributes = researchAttributes.filter(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.USER);
    for (let j = 0; j < membersAttributes.length; j++) {
      const membersAttribute = membersAttributes[j];
      const rAttr = research.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() == membersAttribute._id.toString());

      if (rAttr.value.some(m => m == member)) {
        rAttr.value = rAttr.value.filter(m => m != member);
        hasUpdate = true;
      }
    }

    if (hasUpdate) {
      promises.push(researchService.updateResearchRef(research.external_id, { attributes: research.researchRef.attributes }));
    }
  }

  await Promise.all(promises);

}));

researchHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_CREATED, (payload, reply) => handle(payload, reply, async (event) => {
  const { event: researchTokenSaleCreatedEvent } = event;
  const researchService = new ResearchService();

  const { researchExternalId } = researchTokenSaleCreatedEvent.getSourceData();

  const research = await researchService.getResearch(researchExternalId);
  const investmentOpportunityAttr = research.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.INVESTMENT_OPPORTUNITY.toString());

  let hasUpdate = false;
  if (!investmentOpportunityAttr) {
    research.researchRef.attributes.push({
      researchAttributeId: RESEARCH_ATTRIBUTE.INVESTMENT_OPPORTUNITY,
      value: true
    });
    hasUpdate = true;
  } else if (!investmentOpportunityAttr.value) {
    investmentOpportunityAttr.value = true;
    hasUpdate = true;
  }

  if (hasUpdate) {
    await researchService.updateResearchRef(research.external_id, { attributes: research.researchRef.attributes });
  }

}));



researchHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (event) => {
  const { event: researchTokenSaleProposalSignedEvent } = event;
  
  const researchService = new ResearchService();
  const proposalsService = new ProposalService();

  const proposalId = researchTokenSaleProposalSignedEvent.getProposalId();
  const proposal = await proposalsService.getProposal(proposalId);
  const { researchExternalId } = proposal.details;

  const research = await researchService.getResearch(researchExternalId);
  const investmentOpportunityAttr = research.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.INVESTMENT_OPPORTUNITY.toString());

  let hasUpdate = false;

  if (!investmentOpportunityAttr) {
    research.researchRef.attributes.push({
      researchAttributeId: RESEARCH_ATTRIBUTE.INVESTMENT_OPPORTUNITY,
      value: true
    });
    hasUpdate = true;
  } else if (!investmentOpportunityAttr.value) {
    investmentOpportunityAttr.value = true;
    hasUpdate = true;
  }

  if (hasUpdate) {
    await researchService.updateResearchRef(research.external_id, { attributes: research.researchRef.attributes });
  }

}));


researchHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_CONTRIBUTED, (payload, reply) => handle(payload, reply, async (event) => {
  const { event: researchTokenSaleContributedEvent } = event;
  const researchService = new ResearchService();

  const { tokenSaleExternalId } = researchTokenSaleContributedEvent.getSourceData();
  const researchTokenSale = await deipRpc.api.getResearchTokenSaleAsync(tokenSaleExternalId);

  const research = await researchService.getResearch(researchTokenSale.research_external_id);
  
  if (researchTokenSale.status != TOKEN_SALE_STATUS.ACTIVE) {
    const investmentOpportunityAttr = research.researchRef.attributes.find(rAttr => rAttr.researchAttributeId.toString() == RESEARCH_ATTRIBUTE.INVESTMENT_OPPORTUNITY.toString());
    let hasUpdate = false;

    if (!investmentOpportunityAttr) {
      research.researchRef.attributes.push({
        researchAttributeId: RESEARCH_ATTRIBUTE.INVESTMENT_OPPORTUNITY,
        value: false
      });
      hasUpdate = true;
    } else if (investmentOpportunityAttr.value) {
      investmentOpportunityAttr.value = false;
      hasUpdate = true;
    }

    if (hasUpdate) {
      await researchService.updateResearchRef(research.external_id, { attributes: research.researchRef.attributes });
    }
  }


}));


export default researchHandler;