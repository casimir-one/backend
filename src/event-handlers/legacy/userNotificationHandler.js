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


userNotificationHandler.on(LEGACY_APP_EVENTS.USER_RESIGNATION_PROPOSED, async ({ event: userResignationProposedEvent }) => {
  const { member, researchGroupExternalId } = userResignationProposedEvent.getSourceData();
  
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
        proposal: { action: 13, data: { name: excludedUser.account.name } }, // legacy
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
        proposal: { action: 13, data: { name: excludedUser.account.name } }, // legacy
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