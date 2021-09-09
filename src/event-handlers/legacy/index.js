
import EventEmitter from 'events';
import { handle, fire, wait } from './utils';
import { LEGACY_APP_EVENTS } from './../../constants';
import userNotificationsHandler from './userNotificationHandler';
import researchHandler from './researchHandler';
import expressLicensingHandler from './expressLicensingHandler';
import proposalHandler from './proposalHandler';
import reviewHandler from './reviewHandler';
import config from './../../config';
import { ChainService } from '@deip/chain-service';


import ResearchService from './../../services/impl/read/ProjectDtoService';
import { UserService, TeamDtoService } from './../../services';

class AppEventHandler extends EventEmitter { }

const appEventHandler = new AppEventHandler();

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { tx, emitter, tenant } = source;
  const create_proposal_operation = tx['operations'][0];
  const create_research_operation = tx['operations'][0][1]['proposed_ops'][1]['op'][1]['proposed_ops'][0]['op'];
  const { creator, external_id: proposalId } = create_proposal_operation[1];
  const { external_id: researchExternalId, title, disciplines } = create_research_operation[1];

  const userService = new UserService();
  const chainService = await ChainService.getInstanceAsync(config);
  const chainApi = chainService.getChainApi();

  const requesterUserProfile = await userService.getUser(creator);
  const [requesterUserAccount] = await chainApi.getAccountsAsync([creator]);
  const requesterUser = { profile: requesterUserProfile, account: requesterUserAccount };

  const proposal = await chainApi.getProposalAsync(proposalId);
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
  
  const userService = new UserService();
  const teamDtoService = new TeamDtoService()
  const researchService = new ResearchService();
  const chainService = await ChainService.getInstanceAsync(config);
  const chainApi = chainService.getChainApi();

  const approverUserProfile = await userService.getUser(emitter);
  const [approverUserAccount] = await chainApi.getAccountsAsync([emitter]);
  const approverUser = { profile: approverUserProfile, account: approverUserAccount };

  const requesterUserProfile = await userService.getUser(creator);
  const [requesterUserAccount] = await chainApi.getAccountsAsync([creator]);
  const requesterUser = { profile: requesterUserProfile, account: requesterUserAccount };

  const research = await researchService.getResearch(researchExternalId);
  const researchGroup = await teamDtoService.getTeam(researchGroupExternalId);

  const payload = { research, researchGroup, approver: approverUser, requester: requesterUser, tenant };

  userNotificationsHandler.emit(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_APPROVED, payload);

}));


appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {

  const { tx, emitter, tenant } = source;
  const create_proposal_operation = tx['operations'][0];
  const create_research_operation = tx['operations'][0][1]['proposed_ops'][1]['op'][1]['proposed_ops'][0]['op'];
  const { creator } = create_proposal_operation[1];
  const { external_id: researchExternalId, title, disciplines } = create_research_operation[1];

  const userService = new UserService();
  const chainService = await ChainService.getInstanceAsync(config);
  const chainApi = chainService.getChainApi();

  const rejecterUserProfile = await userService.getUser(emitter);
  const [rejecterUserAccount] = await chainApi.getAccountsAsync([emitter]);
  const rejecterUser = { profile: rejecterUserProfile, account: rejecterUserAccount };

  const requesterUserProfile = await userService.getUser(creator);
  const [requesterUserAccount] = await chainApi.getAccountsAsync([creator]);
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

  const userService = new UserService();
  const chainService = await ChainService.getInstanceAsync(config);
  const chainApi = chainService.getChainApi();

  const requesterUserProfile = await userService.getUser(creator);
  const [requesterUserAccount] = await chainApi.getAccountsAsync([creator]);
  const requesterUser = { profile: requesterUserProfile, account: requesterUserAccount };
  const proposal = await chainApi.getProposalAsync(proposalId);

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

  const userService = new UserService();
  const chainService = await ChainService.getInstanceAsync(config);
  const chainApi = chainService.getChainApi();

  const requesterUserProfile = await userService.getUser(creator);
  const [requesterUserAccount] = await chainApi.getAccountsAsync([creator]);
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

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_EXPRESS_LICENSE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchExpressLicenseProposedEvent, tenant } = source;
  await wait(proposalHandler, researchExpressLicenseProposedEvent, null, tenant);
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_EXPRESS_LICENSE_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchExpressLicenseProposalSignedEvent, tenant } = source;
  await wait(expressLicensingHandler, researchExpressLicenseProposalSignedEvent, null, tenant);
}));

appEventHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: reviewCreatedEvent, tenant } = source;
  await wait(reviewHandler, reviewCreatedEvent, null, tenant);
  fire(userNotificationsHandler, LEGACY_APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_CREATED, source);
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