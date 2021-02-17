
import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { handle, fire, wait } from './utils';
import { APP_EVENTS } from './../constants';
import userNotificationsHandler from './userNotificationHandler';
import researchHandler from './researchHandler';
import researchGroupHandler from './researchGroupHandler';
import userInviteHandler from './userInviteHandler';
import expressLicensingHandler from './expressLicensingHandler';
import proposalHandler from './proposalHandler';
import researchContentHandler from './researchContentHandler';
import reviewHandler from './reviewHandler';

import UserService from './../services/users';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';

class AppEventHandler extends EventEmitter { }

const appEventHandler = new AppEventHandler();


appEventHandler.on(APP_EVENTS.RESEARCH_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchProposedEvent, tenant } = source;
  await wait(researchHandler, researchProposedEvent, null, tenant);
  await wait(proposalHandler, researchProposedEvent);
  fire(userNotificationsHandler, researchProposedEvent)
}));


appEventHandler.on(APP_EVENTS.RESEARCH_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchCreatedEvent, tenant } = source;
  await wait(researchHandler, researchCreatedEvent, null, tenant);
  fire(userNotificationsHandler, researchCreatedEvent);
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
  const { event: userInvitationProposedEvent } = source;
  await wait(proposalHandler, userInvitationProposedEvent);
  await wait(userInviteHandler, userInvitationProposedEvent);
  fire(userNotificationsHandler, userInvitationProposedEvent);
}));


appEventHandler.on(APP_EVENTS.USER_INVITATION_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userInvitationProposalSignedEvent } = source;
  await wait(userInviteHandler, userInvitationProposalSignedEvent);
  fire(researchHandler, userInvitationProposalSignedEvent);
  fire(userNotificationsHandler, userInvitationProposalSignedEvent);
}));


appEventHandler.on(APP_EVENTS.USER_INVITATION_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userInvitationProposalRejectedEvent } = source;
  await wait(userInviteHandler, userInvitationProposalRejectedEvent);
  fire(researchHandler, userInvitationProposalRejectedEvent);
  fire(userNotificationsHandler, userInvitationProposalRejectedEvent);
}));


appEventHandler.on(APP_EVENTS.RESEARCH_CONTENT_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentProposedEvent } = source;
  await wait(researchContentHandler, researchContentProposedEvent);
  await wait(proposalHandler, researchContentProposedEvent);
  fire(userNotificationsHandler, researchContentProposedEvent)
}));


appEventHandler.on(APP_EVENTS.RESEARCH_CONTENT_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentCreatedEvent } = source;
  await wait(researchContentHandler, researchContentCreatedEvent);
  fire(userNotificationsHandler, researchContentCreatedEvent);
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
  const { event: researchUpdatedEvent } = source;
  await wait(researchHandler, researchUpdatedEvent);
  fire(userNotificationsHandler, researchUpdatedEvent);
}));


appEventHandler.on(APP_EVENTS.RESEARCH_UPDATE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchUpdateProposedEvent } = source;
  await wait(researchHandler, researchUpdateProposedEvent);
  await wait(proposalHandler, researchUpdateProposedEvent);
  fire(userNotificationsHandler, researchUpdateProposedEvent);
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
  const { event: researchGroupUpdatedEvent } = source;
  await wait(researchGroupHandler, researchGroupUpdatedEvent);
  fire(userNotificationsHandler, researchGroupUpdatedEvent);
}));


appEventHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdateProposedEvent } = source;
  await wait(proposalHandler, researchGroupUpdateProposedEvent);
  fire(userNotificationsHandler, researchGroupUpdateProposedEvent);
}));

appEventHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdateProposalSignedEvent, tenant } = source;
  await wait(researchGroupHandler, researchGroupUpdateProposalSignedEvent, null, tenant);
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

  const usersService = new UserService();

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
  
  const usersService = new UserService();
  const researchGroupService = new ResearchGroupService();
  const researchService = new ResearchService();

  const approverUserProfile = await usersService.findUserProfileByOwner(emitter);
  const [approverUserAccount] = await deipRpc.api.getAccountsAsync([emitter]);
  const approverUser = { profile: approverUserProfile, account: approverUserAccount };

  const requesterUserProfile = await usersService.findUserProfileByOwner(creator);
  const [requesterUserAccount] = await deipRpc.api.getAccountsAsync([creator]);
  const requesterUser = { profile: requesterUserProfile, account: requesterUserAccount };

  const research = await researchService.getResearch(researchExternalId);
  const researchGroup = await researchGroupService.getResearchGroup(researchGroupExternalId);

  const payload = { research, researchGroup, approver: approverUser, requester: requesterUser, tenant };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_APPLICATION_APPROVED, payload);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_APPLICATION_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {

  const { tx, emitter, tenant } = source;
  const create_proposal_operation = tx['operations'][0];
  const create_research_operation = tx['operations'][0][1]['proposed_ops'][1]['op'][1]['proposed_ops'][0]['op'];
  const { creator } = create_proposal_operation[1];
  const { external_id: researchExternalId, title, disciplines } = create_research_operation[1];

  const usersService = new UserService();

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

  const usersService = new UserService();

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

  const usersService = new UserService();

  const requesterUserProfile = await usersService.findUserProfileByOwner(creator);
  const [requesterUserAccount] = await deipRpc.api.getAccountsAsync([creator]);
  const requesterUser = { profile: requesterUserProfile, account: requesterUserAccount };

  const research = { researchExternalId, title, disciplines };

  const payload = { research, requester: requesterUser, tenant };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_APPLICATION_DELETED, payload);

}));


appEventHandler.on(APP_EVENTS.USER_RESIGNATION_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userResignationProposedEvent } = source;
  await wait(proposalHandler, userResignationProposedEvent);
  fire(userNotificationsHandler, userResignationProposedEvent);
}));


appEventHandler.on(APP_EVENTS.USER_RESIGNATION_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userResignationProposalSignedEvent, tenant } = source;
  fire(researchHandler, userResignationProposalSignedEvent, null, tenant);
  fire(userNotificationsHandler, userResignationProposalSignedEvent);
}));


appEventHandler.on(APP_EVENTS.USER_RESIGNATION_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userResignationProposalSignedEvent, tenant, emitter } = source;
  // register handlers
}));

appEventHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchTokenSaleCreatedEvent } = source;
  await wait(researchHandler, researchTokenSaleCreatedEvent);
  fire(userNotificationsHandler, researchTokenSaleCreatedEvent);
}));


appEventHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchTokenSaleProposedEvent } = source;
  await wait(proposalHandler, researchTokenSaleProposedEvent);
  fire(userNotificationsHandler, researchTokenSaleProposedEvent);
}));


appEventHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchTokenSaleProposalSignedEvent, tenant } = source;
  await wait(researchHandler, researchTokenSaleProposalSignedEvent, null, tenant);
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

appEventHandler.on(APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: reviewCreatedEvent, tenant } = source;
  await wait(reviewHandler, reviewCreatedEvent, null, tenant);
  fire(userNotificationsHandler, APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_CREATED, source);
}));

appEventHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_CONTRIBUTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchTokenSaleContributedEvent, tenant } = source;
  await wait(researchHandler, researchTokenSaleContributedEvent, null, tenant);
}));

appEventHandler.on(APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_REQUESTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: reviewRequestedEvent } = source;
  fire(userNotificationsHandler, reviewRequestedEvent);
}));

appEventHandler.on(APP_EVENTS.RESEARCH_NDA_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchNdaProposedEvent, tenant } = source;
  await wait(proposalHandler, researchNdaProposedEvent, null, tenant);
}));

appEventHandler.on(APP_EVENTS.RESEARCH_NDA_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchNdaProposalSignedEvent, tenant } = source;
  // register handlers
}));

appEventHandler.on(APP_EVENTS.RESEARCH_NDA_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchNdaProposalRejectedEvent, tenant } = source;
  // register handlers
}));

export default appEventHandler;