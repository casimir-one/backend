
import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { APP_EVENTS, PROPOSAL_TYPE, RESEARCH_CONTENT_STATUS, USER_INVITE_STATUS, USER_NOTIFICATION_TYPE, ACTIVITY_LOG_TYPE } from './../constants';
import userNotificationsHandler from './userNotification';
import researchGroupActivityLogHandler from './researchGroupActivityLog';
import usersService from './../services/users';
import * as researchContentService from './../services/researchContent';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';
import userInvitesService from './../services/userInvites';

class AppEventHandler extends EventEmitter { }

const appEventHandler = new AppEventHandler();

appEventHandler.on(APP_EVENTS.PROPOSAL_ACCEPTED, async (source) => {
  const { tx, emitter } = source;
  const [op_name, op_payload] = tx['operations'][0];
  const tag = deipRpc.operations.getOperationTag(op_name);

  switch (tag) {
    case PROPOSAL_TYPE.CREATE_RESEARCH: {
      appEventHandler.emit(APP_EVENTS.RESEARCH_CREATED, source);
      break
    }
    case PROPOSAL_TYPE.UPDATE_RESEARCH: {
      appEventHandler.emit(APP_EVENTS.RESEARCH_UPDATED, source);
      break
    }
    case PROPOSAL_TYPE.CREATE_RESEARCH_MATERIAL: {
      appEventHandler.emit(APP_EVENTS.RESEARCH_MATERIAL_CREATED, source);
      break
    }
    case PROPOSAL_TYPE.UPDATE_RESEARCH_GROUP: {
      appEventHandler.emit(APP_EVENTS.RESEARCH_GROUP_UPDATED, source);
      break
    }
    default: {
      break;
    }
  }
});



appEventHandler.on(APP_EVENTS.RESEARCH_PROPOSED, async (source) => {
  const { opDatum, tenant, context: { emitter } } = source;
  const researchService = new ResearchService(tenant);

  const [opName, opPayload, opProposal] = opDatum;
  const { title: researchTitle, research_group: researchGroupExternalId } = opPayload;

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const proposerUser = await usersService.findUserProfileByOwner(emitter);

  const notificationPayload = { researchGroup: chainResearchGroup, proposer: proposerUser, researchTitle };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_PROPOSED, notificationPayload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_PROPOSED, notificationPayload);
});


appEventHandler.on(APP_EVENTS.RESEARCH_CREATED, async (source) => {
  const { opDatum, tenant, context: { emitter, offchainMeta: { attributes } } } = source;
  const researchService = new ResearchService(tenant);

  const [opName, opPayload, opProposal] = opDatum;
  const { external_id: researchExternalId, research_group: researchGroupExternalId } = opPayload;

  const isProposal = !!opProposal;

  await researchService.createResearchRef({
    externalId: researchExternalId,
    researchGroupExternalId: researchGroupExternalId,
    attributes: attributes,
    status: isProposal ? 'proposed' : 'created'
  });

  if (isProposal) {
    appEventHandler.emit(APP_EVENTS.RESEARCH_PROPOSED, source);
    return;
  }

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const chainResearch = await deipRpc.api.getResearchAsync(researchExternalId);
  const creatorUser = await usersService.findUserProfileByOwner(emitter);
  const isAcceptedByQuorum = researchGroupExternalId != emitter;

  const notificationPayload = { researchGroup: chainResearchGroup, research: chainResearch, creator: creatorUser, isAcceptedByQuorum };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_CREATED, notificationPayload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_CREATED, notificationPayload);
});



appEventHandler.on(APP_EVENTS.INVITATION_CREATED, async (source) => {
  const { opDatum, context: { emitter, tenant } } = source;

  const [opName, opPayload, opProposal] = opDatum;
  const { member: invitee, research_group: researchGroupExternalId, reward_share: rewardShare } = opPayload;
  const { external_id: proposalId, expiration_time: expiration } = opProposal;

  await userInvitesService.createUserInvite({
    externalId: proposalId,
    invitee: invitee,
    researchGroupExternalId: researchGroupExternalId,
    rewardShare: rewardShare,
    status: USER_INVITE_STATUS.SENT,
    notes: "",
    expiration: expiration,
    approvedBy: [emitter]
  });

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);

  let notificationPayload = { researchGroup: chainResearchGroup, invitee };

  userNotificationsHandler.emit(USER_NOTIFICATION_TYPE.INVITATION, notificationPayload);
  researchGroupActivityLogHandler.emit(ACTIVITY_LOG_TYPE.INVITATION, notificationPayload);

});


appEventHandler.on(APP_EVENTS.RESEARCH_MATERIAL_PROPOSED, async (source) => {
  const { tx, emitter } = source;
  const operation = tx['operations'][0][1]['proposed_ops'][0]['op'];
  const { research_group: researchGroupExternalId, research_external_id: researchExternalId, title } = operation[1];

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const chainResearch = await deipRpc.api.getResearchAsync(researchExternalId);
  const proposerUser = await usersService.findUserProfileByOwner(emitter);

  const payload = { researchGroup: chainResearchGroup, research: chainResearch, proposer: proposerUser, title };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_MATERIAL_PROPOSED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_MATERIAL_PROPOSED, payload);
});


appEventHandler.on(APP_EVENTS.RESEARCH_MATERIAL_CREATED, async (source) => {
  const { tx, emitter } = source;
  const operation = tx['operations'][0];
  const { external_id: researchContentExternalId, research_external_id: researchExternalId } = operation[1];

  const chainResearchContent = await deipRpc.api.getResearchContentAsync(researchContentExternalId);
  const chainResearch = await deipRpc.api.getResearchAsync(researchExternalId);
  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(chainResearch.research_group.external_id);
  const creatorUser = await usersService.findUserProfileByOwner(emitter);
  const isAcceptedByQuorum = chainResearchGroup.external_id != emitter;

  const researchContent = await researchContentService.findResearchContentById(researchContentExternalId)

  const researchContentData = researchContent.toObject();
  const update = { status: RESEARCH_CONTENT_STATUS.PUBLISHED };

  const updatedResearchContent = await researchContentService.updateResearchContent(researchContentExternalId, {
    ...researchContentData,
    ...update
  });

  const payload = { researchGroup: chainResearchGroup, research: chainResearch, researchContent: chainResearchContent, creator: creatorUser, isAcceptedByQuorum };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_MATERIAL_CREATED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_MATERIAL_CREATED, payload);
});


appEventHandler.on(APP_EVENTS.RESEARCH_UPDATE_PROPOSED, async (source) => {
  const { tx, emitter } = source;
  const operation = tx['operations'][0][1]['proposed_ops'][0]['op'];
  const { research_group: researchGroupExternalId, external_id: researchExternalId } = operation[1];

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const chainResearch = await deipRpc.api.getResearchAsync(researchExternalId);
  const proposerUser = await usersService.findUserProfileByOwner(emitter);

  const payload = { researchGroup: chainResearchGroup, research: chainResearch, proposer: proposerUser };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_UPDATE_PROPOSED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_UPDATE_PROPOSED, payload);
});


appEventHandler.on(APP_EVENTS.RESEARCH_GROUP_CREATED, async (source) => {
  const { opDatum, context: { emitter, tenant } } = source;
  const researchGroupsService = new ResearchGroupService();

  const [opName, opPayload, opProposal] = opDatum;
  await researchGroupsService.createResearchGroupRef({
    externalId: opPayload.new_account_name,
    creator: opPayload.creator
  });
});

appEventHandler.on(APP_EVENTS.RESEARCH_UPDATED, async (source) => {
  const { tx, emitter, tenant } = source;
  const operation = tx['operations'][0];
  const { research_group: researchGroupExternalId, external_id: researchExternalId } = operation[1];

  const researchService = new ResearchService(tenant);
  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const chainResearch = await deipRpc.api.getResearchAsync(researchExternalId);
  const creatorUser = await usersService.findUserProfileByOwner(emitter);
  const isAcceptedByQuorum = researchGroupExternalId != emitter;

  const payload = { researchGroup: chainResearchGroup, research: chainResearch, creator: creatorUser, isAcceptedByQuorum };

  const researchRef = await researchService.findResearchRef(researchExternalId);
  await researchService.updateResearchRef(researchExternalId, {
    ...researchRef.toObject()
  });

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_UPDATED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_UPDATED, payload);
});


appEventHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED, async (source) => {
  const { tx, emitter } = source;
  const operation = tx['operations'][0][1]['proposed_ops'][0]['op'];
  const { account: researchGroupExternalId } = operation[1];

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const proposerUser = await usersService.findUserProfileByOwner(emitter);

  const payload = { researchGroup: chainResearchGroup, proposer: proposerUser };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED, payload);
});


appEventHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATED, async (source) => {
  const { tx, emitter } = source;
  const operation = tx['operations'][0];
  const { account: researchGroupExternalId } = operation[1];

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const creatorUser = await usersService.findUserProfileByOwner(emitter);
  const isAcceptedByQuorum = researchGroupExternalId != emitter;

  const payload = { researchGroup: chainResearchGroup, creator: creatorUser, isAcceptedByQuorum };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_GROUP_UPDATED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_GROUP_UPDATED, payload);
});


appEventHandler.on(APP_EVENTS.RESEARCH_APPLICATION_CREATED, async (source) => {
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
});


appEventHandler.on(APP_EVENTS.RESEARCH_APPLICATION_APPROVED, async (source) => {
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
});


appEventHandler.on(APP_EVENTS.RESEARCH_APPLICATION_REJECTED, async (source) => {
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
});


appEventHandler.on(APP_EVENTS.RESEARCH_APPLICATION_EDITED, async (source) => {
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
});


appEventHandler.on(APP_EVENTS.RESEARCH_APPLICATION_DELETED, async (source) => {
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
});


export default appEventHandler;