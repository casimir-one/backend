
import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { handle, fire, wait } from './utils';
import { LEGACY_APP_EVENTS } from './../../constants';
import userNotificationsHandler from './userNotificationHandler';
import researchHandler from './researchHandler';
import researchGroupHandler from './researchGroupHandler';
import expressLicensingHandler from './expressLicensingHandler';
import proposalHandler from './proposalHandler';
import researchContentHandler from './researchContentHandler';
import reviewHandler from './reviewHandler';

import UserService from './../../services/users';
import ResearchService from './../../services/impl/read/ProjectDtoService';
import ResearchGroupService from './../../services/researchGroup';

class AppEventHandler extends EventEmitter { }

const appEventHandler = new AppEventHandler();


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentProposedEvent, tenant } = source;
  await wait(researchContentHandler, researchContentProposedEvent, null, tenant);
  await wait(proposalHandler, researchContentProposedEvent, null, tenant);
  fire(userNotificationsHandler, researchContentProposedEvent, null, tenant)
}));


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentCreatedEvent, tenant } = source;
  await wait(researchContentHandler, researchContentCreatedEvent, null, tenant);
  fire(userNotificationsHandler, researchContentCreatedEvent, null, tenant);
}));


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentProposalSignedEvent, tenant } = source;
  await wait(researchContentHandler, researchContentProposalSignedEvent, null, tenant);
  // register handlers
}));


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentProposalRejectedEvent, tenant } = source;
  // register handlers
}));


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_GROUP_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupCreatedEvent, tenant } = source;
  await wait(researchGroupHandler, researchGroupCreatedEvent, null, tenant);
}));


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_GROUP_UPDATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdatedEvent } = source;
  await wait(researchGroupHandler, researchGroupUpdatedEvent);
  fire(userNotificationsHandler, researchGroupUpdatedEvent);
}));


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdateProposedEvent } = source;
  await wait(proposalHandler, researchGroupUpdateProposedEvent);
  fire(userNotificationsHandler, researchGroupUpdateProposedEvent);
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdateProposalSignedEvent, tenant } = source;
  await wait(researchGroupHandler, researchGroupUpdateProposalSignedEvent, null, tenant);
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdateProposalRejectedEvent, tenant, emitter } = source;
  // register handlers
}));


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
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

  userNotificationsHandler.emit(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_CREATED, payload);

}));


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_APPROVED, (payload, reply) => handle(payload, reply, async (source) => {

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

  userNotificationsHandler.emit(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_APPROVED, payload);

}));


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {

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

  userNotificationsHandler.emit(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_REJECTED, payload);

}));


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_EDITED, (payload, reply) => handle(payload, reply, async (source) => {

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

  userNotificationsHandler.emit(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_EDITED, payload);

}));


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_DELETED, (payload, reply) => handle(payload, reply, async (source) => {
  
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

  userNotificationsHandler.emit(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_DELETED, payload);

}));


appEventHandler.on(LEGACY_APP_EVENTS.USER_RESIGNATION_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userResignationProposedEvent } = source;
  await wait(proposalHandler, userResignationProposedEvent);
  fire(userNotificationsHandler, userResignationProposedEvent);
}));


appEventHandler.on(LEGACY_APP_EVENTS.USER_RESIGNATION_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userResignationProposalSignedEvent, tenant } = source;
  fire(researchHandler, userResignationProposalSignedEvent, null, tenant);
  fire(userNotificationsHandler, userResignationProposalSignedEvent);
}));


appEventHandler.on(LEGACY_APP_EVENTS.USER_RESIGNATION_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userResignationProposalSignedEvent, tenant, emitter } = source;
  // register handlers
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_TOKEN_SALE_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchTokenSaleCreatedEvent } = source;
  await wait(researchHandler, researchTokenSaleCreatedEvent);
  fire(userNotificationsHandler, researchTokenSaleCreatedEvent);
}));


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchTokenSaleProposedEvent } = source;
  await wait(proposalHandler, researchTokenSaleProposedEvent);
  fire(userNotificationsHandler, researchTokenSaleProposedEvent);
}));


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchTokenSaleProposalSignedEvent, tenant } = source;
  await wait(researchHandler, researchTokenSaleProposalSignedEvent, null, tenant);
}));


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchTokenSaleProposalRejectedEvent, tenant } = source;
  // register handlers
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_EXPRESS_LICENSE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchExpressLicenseProposedEvent, tenant } = source;
  await wait(proposalHandler, researchExpressLicenseProposedEvent, null, tenant);
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_EXPRESS_LICENSE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchExpressLicenseProposalSignedEvent, tenant } = source;
  await wait(expressLicensingHandler, researchExpressLicenseProposalSignedEvent, null, tenant);
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_EXPRESS_LICENSE_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchExpressLicenseProposalRejectedEvent, tenant } = source;
  // register handlers
}));

appEventHandler.on(LEGACY_APP_EVENTS.ASSET_EXCHANGE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetExchangeProposedEvent, tenant } = source;
  await wait(proposalHandler, assetExchangeProposedEvent, null, tenant);
}));

appEventHandler.on(LEGACY_APP_EVENTS.ASSET_EXCHANGE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetExchangeProposalSignedEvent, tenant } = source;
  // register handlers
}));

appEventHandler.on(LEGACY_APP_EVENTS.ASSET_EXCHANGE_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetExchangeProposalRejectedEvent, tenant } = source;
  // register handlers
}));

appEventHandler.on(LEGACY_APP_EVENTS.ASSET_TRANSFERRED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetTransferredEvent, tenant } = source;
  // register handlers
}));

appEventHandler.on(LEGACY_APP_EVENTS.ASSET_TRANSFER_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetTransferProposedEvent, tenant } = source;
  await wait(proposalHandler, assetTransferProposedEvent, null, tenant);
}));

appEventHandler.on(LEGACY_APP_EVENTS.ASSET_TRANSFER_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetTransferProposalSignedEvent, tenant } = source;
  // register handlers
}));

appEventHandler.on(LEGACY_APP_EVENTS.ASSET_TRANSFER_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetTransferProposalRejectedEvent, tenant } = source;
  // register handlers
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: reviewCreatedEvent, tenant } = source;
  await wait(reviewHandler, reviewCreatedEvent, null, tenant);
  fire(userNotificationsHandler, LEGACY_APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_CREATED, source);
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_TOKEN_SALE_CONTRIBUTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchTokenSaleContributedEvent, tenant } = source;
  await wait(researchHandler, researchTokenSaleContributedEvent, null, tenant);
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_REQUESTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: reviewRequestedEvent } = source;
  fire(userNotificationsHandler, reviewRequestedEvent);
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_NDA_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchNdaProposedEvent, tenant } = source;
  await wait(proposalHandler, researchNdaProposedEvent, null, tenant);
  fire(userNotificationsHandler, researchNdaProposedEvent);
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_NDA_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchNdaProposalSignedEvent, tenant } = source;
  fire(userNotificationsHandler, researchNdaProposalSignedEvent);
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_NDA_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchNdaProposalRejectedEvent, tenant } = source;
  fire(userNotificationsHandler, researchNdaProposalRejectedEvent);
}));

export default appEventHandler;