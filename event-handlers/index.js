
import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { handle, fire, wait } from './utils';
import { APP_EVENTS, SMART_CONTRACT_TYPE, RESEARCH_CONTENT_STATUS, USER_INVITE_STATUS, RESEARCH_STATUS, TOKEN_SALE_STATUS } from './../constants';
import userNotificationsHandler from './userNotificationHandler';
import researchHandler from './researchHandler';
import researchGroupHandler from './researchGroupHandler';
import userInviteHandler from './userInviteHandler';
import expressLicensingHandler from './expressLicensingHandler';
import proposalHandler from './proposalHandler';
import researchContentHandler from './researchContentHandler';
import usersService from './../services/users';
import * as researchContentService from './../services/researchContent';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';

class AppEventHandler extends EventEmitter { }

const appEventHandler = new AppEventHandler();


appEventHandler.on(APP_EVENTS.RESEARCH_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {

  const { event: researchProposedEvent, tenant, emitter } = source;
  
  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();
  const { researchTitle, researchGroupExternalId } = researchProposedEvent.getSourceData();

  await wait(researchHandler, researchProposedEvent, null, tenant);
  await wait(proposalHandler, researchProposedEvent, null, tenant);

  // legacy
  const researchGroup = await researchGroupService.getResearchGroup(researchGroupExternalId);
  const proposerProfile = await usersService.findUserProfileByOwner(emitter);

  const notificationPayload = { researchGroup, proposer: proposerProfile, researchTitle };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_PROPOSED, notificationPayload);
}));


appEventHandler.on(APP_EVENTS.RESEARCH_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchCreatedEvent, tenant, emitter } = source;

  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();

  const research = await wait(researchHandler, researchCreatedEvent, null, tenant);

  // legacy
  const researchGroup = await researchGroupService.getResearchGroup(research.research_group.external_id);
  const creatorUser = await usersService.findUserProfileByOwner(emitter);
  const isAcceptedByQuorum = research.research_group.external_id != emitter;

  const payload = { tenant, researchGroup, research, creator: creatorUser, isAcceptedByQuorum };

  fire(userNotificationsHandler, APP_EVENTS.RESEARCH_CREATED, payload);
}));

appEventHandler.on(APP_EVENTS.RESEARCH_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchProposalSignedEvent, tenant } = source;
  await wait(researchHandler, researchProposalSignedEvent, null, tenant);
}));

appEventHandler.on(APP_EVENTS.RESEARCH_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchProposalRejectedEvent, tenant } = source;
  // register handlers
}));

appEventHandler.on(APP_EVENTS.USER_INVITATION_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userInvitationProposedEvent, tenant, emitter } = source;

  const researchGroupService = new ResearchGroupService();
  await wait(proposalHandler, userInvitationProposedEvent, null, tenant);
  const userInvite = await wait(userInviteHandler, userInvitationProposedEvent, null, tenant);

  // legacy
  const researchGroup = await researchGroupService.getResearchGroup(userInvite.researchGroupExternalId);
  const inviteeProfile = await usersService.findUserProfileByOwner(userInvite.invitee);
  const creatorProfile = await usersService.findUserProfileByOwner(emitter);

  const payload = { tenant, researchGroup, invite: userInvite, invitee: inviteeProfile, creator: creatorProfile };

  userNotificationsHandler.emit(APP_EVENTS.USER_INVITATION_PROPOSED, payload);
}));


appEventHandler.on(APP_EVENTS.USER_INVITATION_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userInvitationProposalSignedEvent, tenant, emitter } = source;
  const researchGroupService = new ResearchGroupService();

  const updatedInvite = await wait(userInviteHandler, userInvitationProposalSignedEvent, null, tenant);
  fire(researchHandler, userInvitationProposalSignedEvent, null, tenant);

  // legacy
  const researchGroup = await researchGroupService.getResearchGroup(updatedInvite.researchGroupExternalId);
  const inviteeProfile = await usersService.findUserProfileByOwner(updatedInvite.invitee);
  const creatorProfile = await usersService.findUserProfileByOwner(updatedInvite.creator);
  const approverProfile = await usersService.findUserProfileByOwner(emitter);

  const payload = { tenant, researchGroup, invite: updatedInvite, invitee: inviteeProfile, creator: creatorProfile, approver: approverProfile };
  fire(userNotificationsHandler, APP_EVENTS.USER_INVITATION_PROPOSAL_SIGNED, payload);
}));


appEventHandler.on(APP_EVENTS.USER_INVITATION_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userInvitationProposalRejectedEvent, tenant, emitter } = source;
  const researchGroupService = new ResearchGroupService();

  const updatedInvite = await wait(userInviteHandler, userInvitationProposalRejectedEvent, null, tenant);

  fire(researchHandler, userInvitationProposalRejectedEvent, null, tenant);

  // legacy
  const researchGroup = await researchGroupService.getResearchGroup(updatedInvite.researchGroupExternalId);
  const inviteeProfile = await usersService.findUserProfileByOwner(updatedInvite.invitee);
  const creatorProfile = await usersService.findUserProfileByOwner(updatedInvite.creator);
  const rejectorProfile = await usersService.findUserProfileByOwner(emitter);

  const payload = { tenant, researchGroup, invite: updatedInvite, invitee: inviteeProfile, creator: creatorProfile, rejector: rejectorProfile };

  fire(userNotificationsHandler, APP_EVENTS.USER_INVITATION_PROPOSAL_REJECTED, payload);
}));


appEventHandler.on(APP_EVENTS.RESEARCH_CONTENT_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentProposedEvent, tenant, emitter } = source;
  const { researchGroupExternalId, researchExternalId, title } = researchContentProposedEvent.getSourceData();
  
  await wait(proposalHandler, researchContentProposedEvent, null, tenant);

  // legacy
  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const chainResearch = await deipRpc.api.getResearchAsync(researchExternalId);
  const proposerUser = await usersService.findUserProfileByOwner(emitter);

  const payload = { researchGroup: chainResearchGroup, research: chainResearch, proposer: proposerUser, title };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_CONTENT_PROPOSED, payload);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_CONTENT_CREATED, (payload, reply) => handle(payload, reply, async (source) => {

  const { event: researchContentCreatedEvent, tenant, emitter } = source;
  const { researchContentExternalId, researchExternalId } = researchContentCreatedEvent.getSourceData();

  await wait(researchContentHandler, researchContentCreatedEvent, null, tenant);

  // legacy
  const chainResearchContent = await deipRpc.api.getResearchContentAsync(researchContentExternalId);
  const chainResearch = await deipRpc.api.getResearchAsync(researchExternalId);
  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(chainResearch.research_group.external_id);
  const creatorUser = await usersService.findUserProfileByOwner(emitter);
  const isAcceptedByQuorum = chainResearchGroup.external_id != emitter;

  const payload = { researchGroup: chainResearchGroup, research: chainResearch, researchContent: chainResearchContent, creator: creatorUser, isAcceptedByQuorum };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_CONTENT_CREATED, payload);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_CONTENT_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentProposalSignedEvent, tenant } = source;
  await wait(researchContentHandler, researchContentProposalSignedEvent, null, tenant);
  // register handlers
}));


appEventHandler.on(APP_EVENTS.RESEARCH_CONTENT_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentProposalRejectedEvent, tenant } = source;
  // register handlers
}));


appEventHandler.on(APP_EVENTS.RESEARCH_UPDATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchUpdatedEvent, tenant, emitter } = source;

  const researchGroupService = new ResearchGroupService();
  const researchService = new ResearchService(tenant);
  const research = await wait(researchHandler, researchUpdatedEvent, null, tenant);

  // legacy
  const researchGroup = await researchGroupService.getResearchGroup(research.research_group.external_id);
  const updaterUser = await usersService.findUserProfileByOwner(emitter);
  const isAcceptedByQuorum = research.research_group.external_id != emitter;

  const payload = { researchGroup: researchGroup, research: research, creator: updaterUser, isAcceptedByQuorum };

  fire(userNotificationsHandler, APP_EVENTS.RESEARCH_UPDATED, payload);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_UPDATE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchUpdateProposedEvent, tenant, emitter } = source;
  const { researchExternalId, researchGroupExternalId } = researchUpdateProposedEvent.getSourceData();

  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();
  await wait(researchHandler, researchUpdateProposedEvent, null, tenant);
  await wait(proposalHandler, researchUpdateProposedEvent, null, tenant);

  // legacy
  const researchGroup = await researchGroupService.getResearchGroup(researchGroupExternalId);
  const research = await researchService.getResearch(researchExternalId)
  const proposerUser = await usersService.findUserProfileByOwner(emitter);

  const payload = { researchGroup: researchGroup, research: research, proposer: proposerUser };

  fire(userNotificationsHandler, APP_EVENTS.RESEARCH_UPDATE_PROPOSED, payload);

}));

appEventHandler.on(APP_EVENTS.RESEARCH_UPDATE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchUpdateProposalSignedEvent, tenant } = source;
  await wait(researchHandler, researchUpdateProposalSignedEvent, null, tenant);
  // register handlers
}));

appEventHandler.on(APP_EVENTS.RESEARCH_UPDATE_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchUpdateProposalRejectedEvent, tenant } = source;
  // register handlers
}));


appEventHandler.on(APP_EVENTS.RESEARCH_GROUP_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupCreatedEvent, tenant } = source;
  await wait(researchGroupHandler, researchGroupCreatedEvent, null, tenant);
}));


appEventHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdatedEvent, tenant, emitter } = source;

  const { researchGroupExternalId } = researchGroupUpdatedEvent.getSourceData();

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const creatorUser = await usersService.findUserProfileByOwner(emitter);
  const isAcceptedByQuorum = researchGroupExternalId != emitter;

  const payload = { researchGroup: chainResearchGroup, creator: creatorUser, isAcceptedByQuorum };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_GROUP_UPDATED, payload);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdateProposedEvent, tenant, emitter } = source;
  const { researchGroupExternalId } = researchGroupUpdateProposedEvent.getSourceData();

  await wait(proposalHandler, researchGroupUpdateProposedEvent, null, tenant);

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const proposerUser = await usersService.findUserProfileByOwner(emitter);

  const payload = { researchGroup: chainResearchGroup, proposer: proposerUser };
  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED, payload);

}));

appEventHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdateProposalSignedEvent, tenant, emitter } = source;
  // register handlers
}));

appEventHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdateProposalRejectedEvent, tenant, emitter } = source;
  // register handlers
}));


appEventHandler.on(APP_EVENTS.RESEARCH_APPLICATION_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { tx, emitter, tenant } = source;
  const create_proposal_operation = tx['operations'][0];
  const create_research_operation = tx['operations'][0][1]['proposed_ops'][1]['op'][1]['proposed_ops'][0]['op'];
  const { creator, external_id: proposalId } = create_proposal_operation[1];
  const { external_id: researchExternalId, title, disciplines } = create_research_operation[1];

  const requesterUserProfile = await usersService.findUserProfileByOwner(creator);
  const [requesterUserAccount] = await deipRpc.api.getAccountsAsync([creator]);
  const requesterUser = { profile: requesterUserProfile, account: requesterUserAccount };

  const proposal = await deipRpc.api.getProposalAsync(proposalId);
  const research = { researchExternalId, title, disciplines };

  const payload = { research, proposal, requester: requesterUser, tenant };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_APPLICATION_CREATED, payload);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_APPLICATION_APPROVED, (payload, reply) => handle(payload, reply, async (source) => {

  const { tx, emitter, tenant } = source;
  const create_proposal_operation = tx['operations'][0];
  const create_research_operation = tx['operations'][0][1]['proposed_ops'][1]['op'][1]['proposed_ops'][0]['op'];
  const { creator } = create_proposal_operation[1];
  const { external_id: researchExternalId, research_group: researchGroupExternalId } = create_research_operation[1];

  const approverUserProfile = await usersService.findUserProfileByOwner(emitter);
  const [approverUserAccount] = await deipRpc.api.getAccountsAsync([emitter]);
  const approverUser = { profile: approverUserProfile, account: approverUserAccount };

  const requesterUserProfile = await usersService.findUserProfileByOwner(creator);
  const [requesterUserAccount] = await deipRpc.api.getAccountsAsync([creator]);
  const requesterUser = { profile: requesterUserProfile, account: requesterUserAccount };

  const chainResearch = await deipRpc.api.getResearchAsync(researchExternalId);
  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);

  const payload = { research: chainResearch, researchGroup: chainResearchGroup, approver: approverUser, requester: requesterUser, tenant };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_APPLICATION_APPROVED, payload);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_APPLICATION_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {

  const { tx, emitter, tenant } = source;
  const create_proposal_operation = tx['operations'][0];
  const create_research_operation = tx['operations'][0][1]['proposed_ops'][1]['op'][1]['proposed_ops'][0]['op'];
  const { creator } = create_proposal_operation[1];
  const { external_id: researchExternalId, title, disciplines } = create_research_operation[1];

  const rejecterUserProfile = await usersService.findUserProfileByOwner(emitter);
  const [rejecterUserAccount] = await deipRpc.api.getAccountsAsync([emitter]);
  const rejecterUser = { profile: rejecterUserProfile, account: rejecterUserAccount };

  const requesterUserProfile = await usersService.findUserProfileByOwner(creator);
  const [requesterUserAccount] = await deipRpc.api.getAccountsAsync([creator]);
  const requesterUser = { profile: requesterUserProfile, account: requesterUserAccount };

  const research = { researchExternalId, title, disciplines };

  const payload = { research, rejecter: rejecterUser, requester: requesterUser, tenant };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_APPLICATION_REJECTED, payload);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_APPLICATION_EDITED, (payload, reply) => handle(payload, reply, async (source) => {

  const { tx, emitter, tenant } = source;
  const create_proposal_operation = tx['operations'][0];
  const create_research_operation = tx['operations'][0][1]['proposed_ops'][1]['op'][1]['proposed_ops'][0]['op'];
  const { creator, external_id: proposalId } = create_proposal_operation[1];
  const { external_id: researchExternalId, title, disciplines } = create_research_operation[1];

  const requesterUserProfile = await usersService.findUserProfileByOwner(creator);
  const [requesterUserAccount] = await deipRpc.api.getAccountsAsync([creator]);
  const requesterUser = { profile: requesterUserProfile, account: requesterUserAccount };
  const proposal = await deipRpc.api.getProposalAsync(proposalId);

  const research = { researchExternalId, title, disciplines };

  const payload = { research, requester: requesterUser, proposal, tenant };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_APPLICATION_EDITED, payload);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_APPLICATION_DELETED, (payload, reply) => handle(payload, reply, async (source) => {
  
  const { tx, emitter, tenant } = source;
  const create_proposal_operation = tx['operations'][0];
  const create_research_operation = tx['operations'][0][1]['proposed_ops'][1]['op'][1]['proposed_ops'][0]['op'];
  const { creator, external_id: proposalId } = create_proposal_operation[1];
  const { external_id: researchExternalId, title, disciplines } = create_research_operation[1];

  const requesterUserProfile = await usersService.findUserProfileByOwner(creator);
  const [requesterUserAccount] = await deipRpc.api.getAccountsAsync([creator]);
  const requesterUser = { profile: requesterUserProfile, account: requesterUserAccount };

  const research = { researchExternalId, title, disciplines };

  const payload = { research, requester: requesterUser, tenant };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_APPLICATION_DELETED, payload);

}));


appEventHandler.on(APP_EVENTS.USER_RESIGNATION_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, tenant, context: { emitter, offchainMeta } } = source;
  const { notes } = offchainMeta;
  const researchGroupService = new ResearchGroupService();

  const [opName, opPayload, opProposal] = opDatum;
  const { member, research_group: researchGroupExternalId } = opPayload;


  const researchGroup = await researchGroupService.getResearchGroup(researchGroupExternalId);
  const memberProfile = await usersService.findUserProfileByOwner(member);
  const creatorProfile = await usersService.findUserProfileByOwner(emitter);

  const event = { tenant, researchGroup, member: memberProfile, creator: creatorProfile };

  fire(userNotificationsHandler, APP_EVENTS.USER_RESIGNATION_PROPOSED, event)
  fire(researchHandler, APP_EVENTS.USER_RESIGNATION_PROPOSED, event)

}));


appEventHandler.on(APP_EVENTS.USER_RESIGNATION_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, tenant, context: { emitter, resignationPayload } } = source;
  const researchGroupService = new ResearchGroupService();

  const [opName, opPayload, opProposal] = opDatum;
  const { member, research_group: researchGroupExternalId } = resignationPayload;

  const researchGroup = await researchGroupService.getResearchGroup(researchGroupExternalId);
  const memberProfile = await usersService.findUserProfileByOwner(member);
  const creatorProfile = await usersService.findUserProfileByOwner(emitter);

  const event = { tenant, researchGroup, member: memberProfile, creator: creatorProfile };

  fire(userNotificationsHandler, APP_EVENTS.USER_RESIGNATION_SIGNED, event)
  fire(researchHandler, APP_EVENTS.USER_RESIGNATION_SIGNED, event)

}));

appEventHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_CREATED, (payload, reply) => handle(payload, reply, async (source) => {

  const { event: researchTokenSaleCreatedEvent, tenant, emitter } = source;
  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();

  const { researchTokenSaleExternalId, researchExternalId, researchGroupExternalId } = researchTokenSaleCreatedEvent.getSourceData();

  // legacy
  const research = await researchService.getResearch(researchExternalId);
  const researchGroup = await researchGroupService.getResearchGroup(researchGroupExternalId);
  const creatorProfile = await usersService.findUserProfileByOwner(emitter);

  const tokenSale = await deipRpc.api.getResearchTokenSaleAsync(researchTokenSaleExternalId);

  const paylod = { researchGroup, research, tokenSale, creator: creatorProfile };

  fire(userNotificationsHandler, APP_EVENTS.RESEARCH_TOKEN_SALE_CREATED, paylod);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchTokenSaleProposedEvent, tenant, emitter } = source;

  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();

  const { researchExternalId, researchGroupExternalId } = researchTokenSaleProposedEvent.getSourceData();

  await wait(proposalHandler, researchTokenSaleProposedEvent, null, tenant);

  // legacy
  const research = await researchService.getResearch(researchExternalId);
  const researchGroup = await researchGroupService.getResearchGroup(researchGroupExternalId);
  const proposerProfile = await usersService.findUserProfileByOwner(emitter);

  const paylod = { researchGroup, research, tokenSale: null, proposer: proposerProfile };

  fire(userNotificationsHandler, APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSED, paylod);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchTokenSaleProposalSignedEvent, tenant } = source;
  // register handlers
}));


appEventHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchTokenSaleProposalRejectedEvent, tenant } = source;
  // register handlers
}));

appEventHandler.on(APP_EVENTS.RESEARCH_EXPRESS_LICENSE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchExpressLicenseProposedEvent, tenant } = source;
  await wait(proposalHandler, researchExpressLicenseProposedEvent, null, tenant);
}));

appEventHandler.on(APP_EVENTS.RESEARCH_EXPRESS_LICENSE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchExpressLicenseProposalSignedEvent, tenant } = source;
  await wait(expressLicensingHandler, researchExpressLicenseProposalSignedEvent, null, tenant);
}));

appEventHandler.on(APP_EVENTS.RESEARCH_EXPRESS_LICENSE_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchExpressLicenseProposalRejectedEvent, tenant } = source;
  // register handlers
}));

appEventHandler.on(APP_EVENTS.ASSET_EXCHANGE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetExchangeProposedEvent, tenant } = source;
  await wait(proposalHandler, assetExchangeProposedEvent, null, tenant);
}));

appEventHandler.on(APP_EVENTS.ASSET_EXCHANGE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetExchangeProposalSignedEvent, tenant } = source;
  // register handlers
}));

appEventHandler.on(APP_EVENTS.ASSET_EXCHANGE_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetExchangeProposalRejectedEvent, tenant } = source;
  // register handlers
}));

appEventHandler.on(APP_EVENTS.ASSET_TRANSFERRED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetTransferredEvent, tenant } = source;
  // register handlers
}));

appEventHandler.on(APP_EVENTS.ASSET_TRANSFER_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetTransferProposedEvent, tenant } = source;
  await wait(proposalHandler, assetTransferProposedEvent, null, tenant);
}));

appEventHandler.on(APP_EVENTS.ASSET_TRANSFER_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetTransferProposalSignedEvent, tenant } = source;
  // register handlers
}));

appEventHandler.on(APP_EVENTS.ASSET_TRANSFER_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetTransferProposalRejectedEvent, tenant } = source;
  // register handlers
}));

export default appEventHandler;