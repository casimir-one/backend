
import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { APP_EVENTS, PROPOSAL_TYPE, RESEARCH_CONTENT_STATUS, USER_INVITE_STATUS, RESEARCH_STATUS } from './../constants';
import userNotificationsHandler from './userNotification';
import researchGroupActivityLogHandler from './researchGroupActivityLog';
import usersService from './../services/users';
import * as researchContentService from './../services/researchContent';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';
import userInvitesService from './../services/userInvites';

class AppEventHandler extends EventEmitter { }

const appEventHandler = new AppEventHandler();

async function handle(payload, { success, failure }, handler) {
    try {
      await handler(payload);
      success();
    } catch (err) {
      failure(err);
    }
}

appEventHandler.on(APP_EVENTS.PROPOSAL_ACCEPTED, (payload, reply) => handle(payload, reply, async (source) => {

  const { tx, emitter } = source;
  const [op_name, op_payload] = tx['operations'][0];
  const tag = deipRpc.operations.getOperationTag(op_name);

  // temp
  let promise = new Promise((resolve, reject) => {

    const dummy = { success: resolve, failure: reject };

    switch (tag) {
      case PROPOSAL_TYPE.UPDATE_RESEARCH: {
        appEventHandler.emit(APP_EVENTS.RESEARCH_UPDATED, source, dummy);
        break
      }
      case PROPOSAL_TYPE.CREATE_RESEARCH_MATERIAL: {
        appEventHandler.emit(APP_EVENTS.RESEARCH_MATERIAL_CREATED, source, dummy);
        break
      }
      case PROPOSAL_TYPE.UPDATE_RESEARCH_GROUP: {
        appEventHandler.emit(APP_EVENTS.RESEARCH_GROUP_UPDATED, source, dummy);
        break
      }
      default: {
        break;
      }
    }
  });

  await promise;
  
}));


appEventHandler.on(APP_EVENTS.RESEARCH_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, tenant, context: { emitter, offchainMeta: { attributes } } } = source;
  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService();

  const [opName, opPayload, opProposal] = opDatum;
  const { external_id: researchExternalId, title: researchTitle, research_group: researchGroupExternalId } = opPayload;

  await researchService.createResearchRef({
    externalId: researchExternalId,
    researchGroupExternalId: researchGroupExternalId,
    attributes: attributes,
    status: RESEARCH_STATUS.PROPOSED
  });

  const researchGroup = await researchGroupService.getResearchGroup(researchGroupExternalId);
  const proposerProfile = await usersService.findUserProfileByOwner(emitter);

  const notificationPayload = { researchGroup, proposer: proposerProfile, researchTitle };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_PROPOSED, notificationPayload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_PROPOSED, notificationPayload);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_CREATED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, tenant, context: { emitter, offchainMeta: { attributes } } } = source;
  const researchService = new ResearchService(tenant);
  const researchGroupService = new ResearchGroupService(tenant);

  const [opName, opPayload] = opDatum;
  const { external_id: researchExternalId, research_group: researchGroupExternalId } = opPayload;

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
  
  const researchGroup = await researchGroupService.getResearchGroup(researchGroupExternalId);
  const research = await researchService.getResearch(researchExternalId);
  const creatorUser = await usersService.findUserProfileByOwner(emitter);
  const isAcceptedByQuorum = researchGroupExternalId != emitter;

  const notificationPayload = { researchGroup, research, creator: creatorUser, isAcceptedByQuorum };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_CREATED, notificationPayload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_CREATED, notificationPayload);

}));


appEventHandler.on(APP_EVENTS.USER_INVITATION_CREATED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, context: { emitter, offchainMeta } } = source;
  const { notes } = offchainMeta;
  const researchGroupService = new ResearchGroupService();

  const [opName, opPayload, opProposal] = opDatum;
  const { member: invitee, research_group: researchGroupExternalId, reward_share: rewardShare } = opPayload;
  const { external_id: proposalId, expiration_time: expiration } = opProposal;

  const userInvite = await userInvitesService.createUserInvite({
    externalId: proposalId,
    invitee: invitee,
    creator: emitter,
    researchGroupExternalId: researchGroupExternalId,
    rewardShare: rewardShare,
    status: USER_INVITE_STATUS.PROPOSED,
    notes: notes,
    expiration: expiration
  });

  const researchGroup = await researchGroupService.getResearchGroup(userInvite.researchGroupExternalId);
  const inviteeProfile = await usersService.findUserProfileByOwner(userInvite.invitee);
  const creatorProfile = await usersService.findUserProfileByOwner(userInvite.creator);

  const notificationPayload = { researchGroup, invite: userInvite, invitee: inviteeProfile, creator: creatorProfile };

  userNotificationsHandler.emit(APP_EVENTS.USER_INVITATION_CREATED, notificationPayload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.USER_INVITATION_CREATED, notificationPayload);

}));


appEventHandler.on(APP_EVENTS.USER_INVITATION_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, context: { emitter, offchainMeta } } = source;
  const researchGroupService = new ResearchGroupService();

  const [opName, opPayload, opProposal] = opDatum;
  const { external_id: proposalId, active_approvals_to_add: approvals1, owner_approvals_to_remove: approvals2 } = opPayload;

  const invite = await userInvitesService.findUserInvite(proposalId);

  const approvers = [...invite.approvedBy, ...approvals1, ...approvals2].reduce((acc, user) => {
    if (!acc.some(u => u == user)) {
      return [...acc, user];
    }
    return acc;
  }, []);
  
  const updatedInvite = await userInvitesService.updateUserInvite(proposalId, {
    status: approvers.some(u => u == invite.invitee) 
      ? USER_INVITE_STATUS.APPROVED 
      : USER_INVITE_STATUS.SENT, // only one research group member needs to agree to send the invite currently
    approvedBy: approvers,
    rejectedBy: invite.rejectedBy,
    failReason: null
  });


  const researchGroup = await researchGroupService.getResearchGroup(updatedInvite.researchGroupExternalId);
  const inviteeProfile = await usersService.findUserProfileByOwner(updatedInvite.invitee);
  const creatorProfile = await usersService.findUserProfileByOwner(updatedInvite.creator);
  const approverProfile = await usersService.findUserProfileByOwner(emitter);

  const notificationPayload = { researchGroup, invite: updatedInvite, invitee: inviteeProfile, creator: creatorProfile, approver: approverProfile };

  userNotificationsHandler.emit(APP_EVENTS.USER_INVITATION_SIGNED, notificationPayload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.USER_INVITATION_SIGNED, notificationPayload);

}));


appEventHandler.on(APP_EVENTS.USER_INVITATION_CANCELED, (payload, reply) => handle(payload, reply, async (source) => {
  const { opDatum, context: { emitter } } = source;
  const researchGroupService = new ResearchGroupService();

  const [opName, opPayload, opProposal] = opDatum;
  const { external_id: proposalId, account: rejector } = opPayload;

  const invite = await userInvitesService.findUserInvite(proposalId);

  const rejectors = [...invite.rejectedBy, rejector].reduce((acc, user) => {
    if (!acc.some(u => u == user)) {
      return [...acc, user];
    }
    return acc;
  }, []);

  const updatedInvite = await userInvitesService.updateUserInvite(proposalId, {
    status: USER_INVITE_STATUS.REJECTED,
    approvedBy: invite.approvedBy,
    rejectedBy: rejectors,
    failReason: null
  });

  const researchGroup = await researchGroupService.getResearchGroup(updatedInvite.researchGroupExternalId);
  const inviteeProfile = await usersService.findUserProfileByOwner(updatedInvite.invitee);
  const creatorProfile = await usersService.findUserProfileByOwner(updatedInvite.creator);
  const rejectorProfile = await usersService.findUserProfileByOwner(emitter);

  const notificationPayload = { researchGroup, invite: updatedInvite, invitee: inviteeProfile, creator: creatorProfile, rejector: rejectorProfile };

  userNotificationsHandler.emit(APP_EVENTS.USER_INVITATION_CANCELED, notificationPayload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.USER_INVITATION_CANCELED, notificationPayload);

}));



appEventHandler.on(APP_EVENTS.RESEARCH_MATERIAL_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {

  const { tx, emitter } = source;
  const operation = tx['operations'][0][1]['proposed_ops'][0]['op'];
  const { research_group: researchGroupExternalId, research_external_id: researchExternalId, title } = operation[1];

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const chainResearch = await deipRpc.api.getResearchAsync(researchExternalId);
  const proposerUser = await usersService.findUserProfileByOwner(emitter);

  const payload = { researchGroup: chainResearchGroup, research: chainResearch, proposer: proposerUser, title };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_MATERIAL_PROPOSED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_MATERIAL_PROPOSED, payload);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_MATERIAL_CREATED, (payload, reply) => handle(payload, reply, async (source) => {

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

}));


appEventHandler.on(APP_EVENTS.RESEARCH_UPDATE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {

  const { tx, emitter } = source;
  const operation = tx['operations'][0][1]['proposed_ops'][0]['op'];
  const { research_group: researchGroupExternalId, external_id: researchExternalId } = operation[1];

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const chainResearch = await deipRpc.api.getResearchAsync(researchExternalId);
  const proposerUser = await usersService.findUserProfileByOwner(emitter);

  const payload = { researchGroup: chainResearchGroup, research: chainResearch, proposer: proposerUser };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_UPDATE_PROPOSED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_UPDATE_PROPOSED, payload);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_GROUP_CREATED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, context: { emitter, tenant } } = source;
  const researchGroupsService = new ResearchGroupService();

  const [opName, opPayload, opProposal] = opDatum;
  await researchGroupsService.createResearchGroupRef({
    externalId: opPayload.new_account_name,
    creator: opPayload.creator
  });

}));


appEventHandler.on(APP_EVENTS.RESEARCH_UPDATED, (payload, reply) => handle(payload, reply, async (source) => {

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
    ...researchRef
  });

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_UPDATED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_UPDATED, payload);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {

  const { tx, emitter } = source;
  const operation = tx['operations'][0][1]['proposed_ops'][0]['op'];
  const { account: researchGroupExternalId } = operation[1];

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const proposerUser = await usersService.findUserProfileByOwner(emitter);

  const payload = { researchGroup: chainResearchGroup, proposer: proposerUser };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED, payload);

}));


appEventHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATED, (payload, reply) => handle(payload, reply, async (source) => {

  const { tx, emitter } = source;
  const operation = tx['operations'][0];
  const { account: researchGroupExternalId } = operation[1];

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const creatorUser = await usersService.findUserProfileByOwner(emitter);
  const isAcceptedByQuorum = researchGroupExternalId != emitter;

  const payload = { researchGroup: chainResearchGroup, creator: creatorUser, isAcceptedByQuorum };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_GROUP_UPDATED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_GROUP_UPDATED, payload);

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


export default appEventHandler;