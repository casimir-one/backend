import EventEmitter from 'events';
import { LEGACY_APP_EVENTS, USER_NOTIFICATION_TYPE, PROPOSAL_STATUS, RESEARCH_ATTRIBUTE } from './../../constants';
import { UserDtoService } from './../../services';
import UserNotificationService from './../../services/legacy/userNotification';
import ResearchService from './../../services/impl/read/ProjectDtoService';
import { TeamDtoService } from './../../services';
import ProposalService from './../../services/impl/read/ProposalDtoService';
import TenantService from './../../services/legacy/tenant';
import config from './../../config';
import { ChainService } from '@deip/chain-service';

const userDtoService = new UserDtoService({ scoped: false });
const teamDtoService = new TeamDtoService({ scoped: false });
const researchService = new ResearchService({ scoped: false });
const userNotificationService = new UserNotificationService();

class UserNotificationHandler extends EventEmitter { }

const userNotificationHandler = new UserNotificationHandler();

userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_CREATED, async (payload) => {
  const { research, requester, tenant, proposal } = payload;
  const notificationsPromises = [];

  for (let i = 0; i < tenant.admins.length; i++) {
    let admin = tenant.admins[i];
    let promise = userNotificationService.createUserNotification({
      username: admin,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.RESEARCH_APPLICATION_CREATED,
      metadata: {
        research,
        requester,
        proposal
      }
    });
    notificationsPromises.push(promise);
  }
  
  Promise.all(notificationsPromises);
});


userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_APPROVED, async (payload) => {
  const { research, researchGroup, requester, approver, tenant } = payload;
  userNotificationService.createUserNotification({
    username: requester.account.name,
    status: 'unread',
    type: USER_NOTIFICATION_TYPE.RESEARCH_APPLICATION_APPROVED,
    metadata: {
      researchGroup,
      research,
      approver,
      requester
    }
  });
});


userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_REJECTED, async (payload) => {
  const { research, requester, rejecter, tenant } = payload;
  userNotificationService.createUserNotification({
    username: requester.account.name,
    status: 'unread',
    type: USER_NOTIFICATION_TYPE.RESEARCH_APPLICATION_REJECTED,
    metadata: {
      research,
      rejecter,
      requester
    }
  });
});


userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_EDITED, async (payload) => {
  const { research, requester, proposal, tenant } = payload;
  const notificationsPromises = [];

  for (let i = 0; i < tenant.admins.length; i++) {
    let admin = tenant.admins[i];
    let promise = userNotificationService.createUserNotification({
      username: admin,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.RESEARCH_APPLICATION_EDITED,
      metadata: {
        research,
        proposal,
        requester
      }
    });
    notificationsPromises.push(promise);
  }
});


userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_APPLICATION_DELETED, async (payload) => {
  const { research, requester, tenant } = payload;
  const notificationsPromises = [];

  for (let i = 0; i < tenant.admins.length; i++) {
    let admin = tenant.admins[i];
    let promise = userNotificationService.createUserNotification({
      username: admin,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.RESEARCH_APPLICATION_DELETED,
      metadata: {
        research,
        requester
      }
    });
    notificationsPromises.push(promise);
  }
});


userNotificationHandler.on(LEGACY_APP_EVENTS.USER_RESIGNATION_PROPOSED, async ({ event: userResignationProposedEvent }) => {
  const { member, researchGroupExternalId } = userResignationProposedEvent.getSourceData();
  
  const chainService = await ChainService.getInstanceAsync(config);
  const chainNodeClient = chainService.getChainNodeClient();
  const deipRpc = chainNodeClient;

  const eventEmitter = userResignationProposedEvent.getEventEmitter();
  const researchGroup = await teamDtoService.getTeam(researchGroupExternalId);
  const emitterUser = await userDtoService.getUser(eventEmitter);
  const excludedUser = await userDtoService.getUser(member);
  const notificationsPromises = [];
  const refs = await chainApi.getTeamMemberReferencesAsync([researchGroup.external_id], false);
  const [members] = refs.map((g) => g.map(m => m.account));

  for (let i = 0; i < members.length; i++) {
    let member = members[i];
    let memberNotificationPromise = userNotificationService.createUserNotification({
      username: member.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("leave_research_group_membership"), data: { name: excludedUser.account.name } }, // legacy
        researchGroup,
        excluded: excludedUser,
        emitter: emitterUser
      }
    });
    notificationsPromises.push(memberNotificationPromise);
  }

  Promise.all(notificationsPromises);
});

userNotificationHandler.on(LEGACY_APP_EVENTS.USER_RESIGNATION_PROPOSAL_SIGNED, async ({ event: userResignationProposalSignedEvent }) => {
  const proposalsService = new ProposalService();
  const chainService = await ChainService.getInstanceAsync(config);
  const chainNodeClient = chainService.getChainNodeClient();
  const deipRpc = chainNodeClient;

  const proposalId = userResignationProposalSignedEvent.getProposalId();
  const proposal = await proposalsService.getProposal(proposalId);
  const { extendedDetails: { researchGroup, member: excludedUser }, proposer: emitterUser } = proposal;

  const notificationsPromises = [];
  const refs = await chainApi.getTeamMemberReferencesAsync([researchGroup.external_id], false);
  const [members] = refs.map((g) => g.map(m => m.account));

  for (let i = 0; i < members.length; i++) {
    let member = members[i];
    let memberNotificationPromise = userNotificationService.createUserNotification({
      username: member.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        isProposalAutoAccepted: true, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("leave_research_group_membership"), data: { name: excludedUser.account.name } }, // legacy
        researchGroup,
        excluded: excludedUser,
        emitter: emitterUser
      }
    });

    notificationsPromises.push(memberNotificationPromise);
  }

  notificationsPromises.push(userNotificationService.createUserNotification({
    username: excludedUser.account.name,
    status: 'unread',
    type: USER_NOTIFICATION_TYPE.EXCLUSION_APPROVED,
    metadata: {
      researchGroup,
      excluded: excludedUser
    }
  }));

  Promise.all(notificationsPromises);
});

export default userNotificationHandler;