import EventEmitter from 'events';
import { APP_EVENTS, USER_INVITE_STATUS } from './../constants';
import { handle, fire, wait } from './utils';
import UserInviteService from './../services/userInvites';
import ResearchService from './../services/research';

class UserInviteHandler extends EventEmitter { }

const userInviteHandler = new UserInviteHandler();

userInviteHandler.on(APP_EVENTS.USER_INVITATION_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { opDatum, tenant, context: { emitter, offchainMeta } } = source;
  const { notes, researches } = offchainMeta;
  const userInviteService = new UserInviteService();

  const [opName, opPayload, opProposal] = opDatum;
  const { member: invitee, research_group: researchGroupExternalId, reward_share: rewardShare } = opPayload;
  const { external_id: proposalId, expiration_time: expiration } = opProposal;

  const userInvite = await userInviteService.createUserInvite({
    externalId: proposalId,
    invitee: invitee,
    creator: emitter,
    researchGroupExternalId: researchGroupExternalId,
    rewardShare: rewardShare,
    status: USER_INVITE_STATUS.PROPOSED,
    researches: researches,
    notes: notes,
    expiration: expiration
  });

  return userInvite;

}));


userInviteHandler.on(APP_EVENTS.USER_INVITATION_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {

  const { opDatum, tenant, context: { emitter, offchainMeta } } = source;  
  const userInviteService = new UserInviteService();

  const [opName, opPayload, opProposal] = opDatum;
  const { external_id: proposalId, active_approvals_to_add: approvals1, owner_approvals_to_add: approvals2 } = opPayload;

  const invite = await userInviteService.findUserInvite(proposalId);

  const approvers = [...invite.approvedBy, ...approvals1, ...approvals2].reduce((acc, user) => {
    if (!acc.some(u => u == user)) {
      return [...acc, user];
    }
    return acc;
  }, []);

  const updatedInvite = await userInviteService.updateUserInvite(proposalId, {
    status: approvers.some(u => u == invite.invitee)
      ? USER_INVITE_STATUS.APPROVED
      : USER_INVITE_STATUS.SENT, // only one research group member needs to agree to send the invite currently
    approvedBy: approvers,
    rejectedBy: invite.rejectedBy,
    failReason: null
  });

  return updatedInvite;

}));


userInviteHandler.on(APP_EVENTS.USER_INVITATION_CANCELED, (payload, reply) => handle(payload, reply, async (source) => {
  const { opDatum, tenant, context: { emitter } } = source;
  const userInviteService = new UserInviteService();

  const [opName, opPayload, opProposal] = opDatum;
  const { external_id: proposalId, account: rejector } = opPayload;

  const invite = await userInviteService.findUserInvite(proposalId);

  const rejectors = [...invite.rejectedBy, rejector].reduce((acc, user) => {
    if (!acc.some(u => u == user)) {
      return [...acc, user];
    }
    return acc;
  }, []);

  const updatedInvite = await userInviteService.updateUserInvite(proposalId, {
    status: USER_INVITE_STATUS.REJECTED,
    approvedBy: invite.approvedBy,
    rejectedBy: rejectors,
    failReason: null
  });

  return updatedInvite;

}));



export default userInviteHandler;