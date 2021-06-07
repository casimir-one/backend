import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { LEGACY_APP_EVENTS, USER_NOTIFICATION_TYPE, PROPOSAL_STATUS, RESEARCH_ATTRIBUTE } from './../../constants';
import { UserDtoService } from './../../services';
import UserNotificationService from './../../services/legacy/userNotification';
import ResearchContentService from './../../services/legacy/researchContent';
import ReviewService from './../../services/legacy/review';
import ResearchService from './../../services/impl/read/ProjectDtoService';
import { TeamDtoService } from './../../services';
import ProposalService from './../../services/impl/read/ProposalDtoService';
import TenantService from './../../services/legacy/tenant';

const userDtoService = new UserDtoService({ scoped: false });
const teamDtoService = new TeamDtoService({ scoped: false });
const researchService = new ResearchService({ scoped: false });
const userNotificationService = new UserNotificationService();

class UserNotificationHandler extends EventEmitter { }

const userNotificationHandler = new UserNotificationHandler();


userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_PROPOSED, async ({ event: researchContentProposedEvent, tenant }) => {
  const { researchGroupExternalId, researchExternalId, source: { offchain: { title } } } = researchContentProposedEvent.getSourceData();
  const eventEmitter = researchContentProposedEvent.getEventEmitter();

  const researchGroup = await teamDtoService.getTeam(researchGroupExternalId);
  const research = await researchService.getResearch(researchExternalId);

  const emitterUser = await userDtoService.getUser(eventEmitter);

  const members = await userDtoService.getUsers([...tenant.admins, ...research.members].reduce((acc, name) => !acc.includes(name) ? [name, ...acc] : acc, []));

  const notificationsPromises = [];
  const data = { title };

  for (let i = 0; i < members.length; i++) {
    let member = members[i];
    let promise = userNotificationService.createUserNotification({
      username: member.username,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("create_research_content"), data }, // legacy
        researchGroup,
        research,
        researchContent: null, // legacy
        emitter: emitterUser
      }
    });
    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_CREATED, async ({ event: researchContentCreatedEvent, tenant }) => {
  const researchContentService = new ResearchContentService();

  const { researchContentExternalId, researchExternalId } = researchContentCreatedEvent.getSourceData();
  const eventEmitter = researchContentCreatedEvent.getEventEmitter();

  const researchContent = await researchContentService.getResearchContent(researchContentExternalId);
  const research = await researchService.getResearch(researchExternalId);
  const researchGroup = await teamDtoService.getTeam(research.research_group.external_id);
  const emitterUser = await userDtoService.getUser(eventEmitter);
  const isAcceptedByQuorum = researchGroup.external_id != eventEmitter;

  const members = await userDtoService.getUsers([...tenant.admins, ...research.members].reduce((acc, name) => !acc.includes(name) ? [name, ...acc] : acc, []));

  const notificationsPromises = [];
  const data = isAcceptedByQuorum ? { title: researchContent.title } : undefined;

  for (let i = 0; i < members.length; i++) {
    let member = members[i];
    let promise = userNotificationService.createUserNotification({
      username: member.username,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        isProposalAutoAccepted: true, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("create_research_content"), data, is_completed: true }, // legacy
        researchGroup,
        research,
        researchContent,
        emitter: emitterUser
      }
    });
    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});



userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED, async ({ event: researchGroupUpdateProposedEvent }) => {
  const { researchGroupExternalId } = researchGroupUpdateProposedEvent.getSourceData();
  const eventEmitter = researchGroupUpdateProposedEvent.getEventEmitter();

  const researchGroup = await teamDtoService.getTeam(researchGroupExternalId);
  const emitterUser = await userDtoService.getUser(eventEmitter);
  const members = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  const notificationsPromises = [];

  for (let i = 0; i < members.length; i++) {
    let rgt = members[i];
    let promise = userNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("update_account") }, // legacy
        researchGroup,
        emitter: emitterUser
      }
    });
    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_GROUP_UPDATED, async ({ event: researchGroupUpdatedEvent }) => {
  const { researchGroupExternalId } = researchGroupUpdatedEvent.getSourceData();
  const eventEmitter = researchGroupUpdatedEvent.getEventEmitter();

  const researchGroup = await teamDtoService.getTeam(researchGroupExternalId);
  const emitterUser = await userDtoService.getUser(eventEmitter);

  const members = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  const notificationsPromises = [];

  for (let i = 0; i < members.length; i++) {
    let rgt = members[i];
    let promise = userNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        isProposalAutoAccepted: true, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("update_account"), is_completed: true }, // legacy
        researchGroup,
        emitter: emitterUser
      }
    });
    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});


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
  const eventEmitter = userResignationProposedEvent.getEventEmitter();
  const researchGroup = await teamDtoService.getTeam(researchGroupExternalId);
  const emitterUser = await userDtoService.getUser(eventEmitter);
  const excludedUser = await userDtoService.getUser(member);
  const notificationsPromises = [];
  const rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  for (let i = 0; i < rgtList.length; i++) {
    let rgt = rgtList[i];
    let memberNotificationPromise = userNotificationService.createUserNotification({
      username: rgt.owner,
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
  const proposalId = userResignationProposalSignedEvent.getProposalId();
  const proposal = await proposalsService.getProposal(proposalId);
  const { extendedDetails: { researchGroup, member: excludedUser }, proposer: emitterUser } = proposal;

  const notificationsPromises = [];
  const rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  for (let i = 0; i < rgtList.length; i++) {
    let rgt = rgtList[i];
    let memberNotificationPromise = userNotificationService.createUserNotification({
      username: rgt.owner,
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


userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSED, async ({ event: researchTokenSaleProposedEvent }) => {
  const { researchExternalId, researchGroupExternalId } = researchTokenSaleProposedEvent.getSourceData();
  const eventEmitter = researchTokenSaleProposedEvent.getEventEmitter();

  const research = await researchService.getResearch(researchExternalId);
  const researchGroup = await teamDtoService.getTeam(researchGroupExternalId);
  const emitterUser = await userDtoService.getUser(eventEmitter);

  const members = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  const notificationsPromises = [];
  for (let i = 0; i < members.length; i++) {
    let rgt = members[i];
    let memberNotificationPromise = userNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("create_research_token_sale"), data: { research_id: research.id } }, // legacy
        researchGroup,
        research,
        tokenSale: null,
        emitter: emitterUser
      }
    });
    notificationsPromises.push(memberNotificationPromise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_TOKEN_SALE_CREATED, async ({ event: researchTokenSaleCreatedEvent }) => {
  const { researchTokenSaleExternalId, researchExternalId, researchGroupExternalId } = researchTokenSaleCreatedEvent.getSourceData();
  const eventEmitter = researchTokenSaleCreatedEvent.getEventEmitter();

  const research = await researchService.getResearch(researchExternalId);
  const researchGroup = await teamDtoService.getTeam(researchGroupExternalId);
  const emitterUser = await userDtoService.getUser(eventEmitter);
  const tokenSale = await deipRpc.api.getResearchTokenSaleAsync(researchTokenSaleExternalId);
  const members = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  const notificationsPromises = [];
  for (let i = 0; i < members.length; i++) {
    let rgt = members[i];
    let memberNotificationPromise = userNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        proposal: { action: deipRpc.operations.getOperationTag("create_research_token_sale"), data: { research_id: research.id }, is_completed: true }, // legacy
        researchGroup,
        research,
        tokenSale,
        emitter: emitterUser
      }
    });
    notificationsPromises.push(memberNotificationPromise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_CREATED, async (source) => {
  const type = USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW;
  const { event: reviewCreatedEvent, tenant } = source;
  const researchContentService = new ResearchContentService();
  const reviewService = new ReviewService();
  const { reviewExternalId, researchContentExternalId, author } = reviewCreatedEvent.getSourceData();

  let reviewer = await userDtoService.getUser(author);
  let researchContent = await researchContentService.getResearchContent(researchContentExternalId);

  let research = await researchService.getResearch(researchContent.research_external_id);
  let review = await reviewService.getReview(reviewExternalId);

  let researchGroup = await teamDtoService.getTeam(research.research_group.external_id);
  let rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);
  let notificationsPromises = [];

  for (let i = 0; i < rgtList.length; i++) {
    const rgt = rgtList[i];
    let promise = userNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type,
      metadata: {
        review,
        researchContent,
        research,
        researchGroup,
        reviewer
      }
    });
    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_REQUESTED, async ({ event: reviewRequestedEvent }) => {
  const { source: { offchain: { reviewRequest }}} = reviewRequestedEvent.getSourceData();
  const { requestor: requestorId, expert: expertId, researchContentExternalId } = reviewRequest;
  const researchContentService = new ResearchContentService();
  let requestor = await userDtoService.getUser(requestorId);
  let expert = await userDtoService.getUser(expertId);
  let researchContent = await researchContentService.getResearchContent(researchContentExternalId);

  let research = await researchService.getResearch(researchContent.research_external_id);
  let researchGroup = await teamDtoService.getTeam(research.research_group.external_id);

  userNotificationService.createUserNotification({
    username: expert.account.name,
    status: 'unread',
    type: USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW_REQUEST,
    metadata: {
      requestor,
      expert,
      researchGroup,
      research,
      researchContent
    }
  });
});

userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_NDA_PROPOSED, async ({ event: researchNdaProposedEvent }) => {
  const tenantService = new TenantService()
  const { researchExternalId } = researchNdaProposedEvent.getSourceData();
  const eventEmitter = researchNdaProposedEvent.getEventEmitter()

  const research = await researchService.getResearch(researchExternalId);
  const emitter = await userDtoService.getUser(eventEmitter);
  const tenant = await tenantService.getTenant(emitter.tenantId);

  const notificationsPromises = [];

  for (let i = 0; i < research.members.length; i++) {
    const username = research.members[i];
    let promise = userNotificationService.createUserNotification({
      username,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.RESEARCH_NDA_PROPOSED,
      metadata: {
        research,
        emitter,
        tenant
      }
    });
    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});

userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_NDA_PROPOSAL_SIGNED, async ({ event: researchNdaProposalSignedEvent }) => {
  const tenantService = new TenantService()
  const proposalsService = new ProposalService();

  const proposalId = researchNdaProposalSignedEvent.getProposalId();
  
  const proposal = await proposalsService.getProposal(proposalId);
  if (proposal.proposal.status != 1) {
    const research = await researchService.getResearch(proposal.details.researchExternalId);
    const tenant = await tenantService.getTenant(proposal.proposer.tenantId);
    const creator = await userDtoService.getUser(proposal.proposer.username);

    const notificationsPromises = [];

    for (let i = 0; i < [...research.members, proposal.proposer.username].length; i++) {
      const username = research.members[i] || proposal.proposer.username;
      let promise = userNotificationService.createUserNotification({
        username,
        status: 'unread',
        type: USER_NOTIFICATION_TYPE.RESEARCH_NDA_SIGNED,
        metadata: {
          research,
          creator,
          tenant
        }
      });
      notificationsPromises.push(promise);
    }

    Promise.all(notificationsPromises);
  }
});

userNotificationHandler.on(LEGACY_APP_EVENTS.RESEARCH_NDA_PROPOSAL_REJECTED, async ({ event: researchNdaProposalRejectedEvent }) => {
  const tenantService = new TenantService()
  const proposalsService = new ProposalService();

  const proposalId = researchNdaProposalRejectedEvent.getProposalId();
  
  const proposal = await proposalsService.getProposal(proposalId);
  if (proposal.proposal.status != 1) {
    const research = await researchService.getResearch(proposal.details.researchExternalId);
    const tenant = await tenantService.getTenant(proposal.proposer.tenantId);
    const creator = await userDtoService.getUser(proposal.proposer.username);

    const notificationsPromises = [];

    for (let i = 0; i < [...research.members, proposal.proposer.username].length; i++) {
      const username = research.members[i] || proposal.proposer.username;
      let promise = userNotificationService.createUserNotification({
        username,
        status: 'unread',
        type: USER_NOTIFICATION_TYPE.RESEARCH_NDA_REJECTED,
        metadata: {
          research,
          creator,
          tenant
        }
      });
      notificationsPromises.push(promise);
    }

    Promise.all(notificationsPromises);
  }
});

export default userNotificationHandler;