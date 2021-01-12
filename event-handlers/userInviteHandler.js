import EventEmitter from 'events';
import { APP_EVENTS, USER_INVITE_STATUS, PROPOSAL_STATUS } from './../constants';
import { handle, fire, wait } from './utils';
import UserInviteService from './../services/userInvites';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';
import ProposalService from './../services/proposal';
import usersService from './../services/users';

class UserInviteHandler extends EventEmitter { }

const userInviteHandler = new UserInviteHandler();

userInviteHandler.on(APP_EVENTS.USER_INVITATION_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userInvitationProposedEvent, emitter, tenant } = source;
  const userInviteService = new UserInviteService();
  const researchService = new ResearchService();
  const researchGroupService = new ResearchGroupService();
  const proposalsService = new ProposalService(usersService, researchGroupService, researchService);

  const { invitee, researchGroupExternalId, rewardShare, researches, notes } = userInvitationProposedEvent.getSourceData();
  const expiration = userInvitationProposedEvent.getProposalExpirationTime();
  const proposalId = userInvitationProposedEvent.getProposalId();
  const proposal = await proposalsService.getProposal(proposalId);

  const userInvite = await userInviteService.createUserInvite({
    externalId: proposalId,
    invitee: invitee,
    creator: proposal.proposal.proposer,
    researchGroupExternalId: researchGroupExternalId,
    rewardShare: rewardShare,
    status: USER_INVITE_STATUS.PROPOSED,
    researches: researches,
    notes: notes,
    expiration: expiration
  });

  return userInvite;
}));


userInviteHandler.on(APP_EVENTS.USER_INVITATION_PROPOSAL_SIGNED, (payload, reply) => handle(payload, reply, async (source) => {

  const { event: userInvitationProposalSignedEvent, tenant } = source;
  const userInviteService = new UserInviteService();
  const researchService = new ResearchService();
  const researchGroupService = new ResearchGroupService();
  const proposalsService = new ProposalService(usersService, researchGroupService, researchService);

  const proposalId = userInvitationProposalSignedEvent.getProposalId();
  const proposal = await proposalsService.getProposal(proposalId);

  const updatedInvite = await userInviteService.updateUserInvite(proposalId, {
    status: proposal.proposal.status == PROPOSAL_STATUS.APPROVED
      ? USER_INVITE_STATUS.APPROVED
      : USER_INVITE_STATUS.SENT, // only one research group member needs to agree to send the invite currently
    failReason: null
  });

  return updatedInvite;

}));


userInviteHandler.on(APP_EVENTS.USER_INVITATION_PROPOSAL_REJECTED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userInvitationProposalRejectedEvent, tenant } = source;
  const userInviteService = new UserInviteService();

  const proposalId = userInvitationProposalRejectedEvent.getProposalId();
  const invite = await userInviteService.findUserInvite(proposalId);

  const updatedInvite = await userInviteService.updateUserInvite(proposalId, {
    status: USER_INVITE_STATUS.REJECTED,
    failReason: null
  });

  return updatedInvite;

}));



export default userInviteHandler;