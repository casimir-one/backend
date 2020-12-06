import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { APP_EVENTS, USER_NOTIFICATION_TYPE, USER_INVITE_STATUS } from './../constants';
import usersService from './../services/users';
import * as usersNotificationService from './../services/userNotification';
import ResearchContentService from './../services/researchContent';
import ReviewService from '../services/review';

class UserNotificationHandler extends EventEmitter { }

const userNotificationHandler = new UserNotificationHandler();

userNotificationHandler.on(APP_EVENTS.RESEARCH_PROPOSED, async (payload) => {
  const { researchGroup, proposer, researchTitle } = payload;
  const members = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);
  
  const notificationsPromises = [];
  const data = { title: researchTitle };

  for (let i = 0; i < members.length; i++) {
    let rgt = members[i];
    let promise = usersNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("create_research"), data }, // legacy
        researchGroup,
        research: null, // legacy
        creatorProfile: proposer
      }
    });
    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(APP_EVENTS.RESEARCH_CREATED, async (payload) => {
  const { researchGroup, research, creator, isAcceptedByQuorum } = payload;
  const members = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  const notificationsPromises = [];
  const data = isAcceptedByQuorum ? { title: research.title } : undefined;

  for (let i = 0; i < members.length; i++) {
    let rgt = members[i];
    let promise = usersNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        isProposalAutoAccepted: true, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("create_research"), data, is_completed: true }, // legacy
        researchGroup,
        research,
        creatorProfile: creator
      }
    });
    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(APP_EVENTS.RESEARCH_CONTENT_PROPOSED, async (payload) => {
  const { researchGroup, research, proposer, title } = payload;
  const members = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  const notificationsPromises = [];
  const data = { title };

  for (let i = 0; i < members.length; i++) {
    let rgt = members[i];
    let promise = usersNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("create_research_content"), data }, // legacy
        researchGroup,
        research,
        researchContent: null, // legacy
        creatorProfile: proposer
      }
    });
    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(APP_EVENTS.RESEARCH_CONTENT_CREATED, async (payload) => {
  const { researchGroup, research, researchContent, creator, isAcceptedByQuorum } = payload;
  const members = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  const notificationsPromises = [];
  const data = isAcceptedByQuorum ? { title: researchContent.title } : undefined;

  for (let i = 0; i < members.length; i++) {
    let rgt = members[i];
    let promise = usersNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        isProposalAutoAccepted: true, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("create_research_content"), data, is_completed: true }, // legacy
        researchGroup,
        research,
        researchContent,
        creatorProfile: creator
      }
    });
    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(APP_EVENTS.RESEARCH_UPDATE_PROPOSED, async (payload) => {
  const { researchGroup, research, proposer } = payload;
  const members = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  const notificationsPromises = [];
  const data = { permlink: research.permlink };

  for (let i = 0; i < members.length; i++) {
    let rgt = members[i];
    let promise = usersNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("update_research"), data }, // legacy
        researchGroup,
        research,
        creatorProfile: proposer
      }
    });
    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});



userNotificationHandler.on(APP_EVENTS.RESEARCH_UPDATED, async (payload) => {
  const { researchGroup, research, creator, isAcceptedByQuorum } = payload;
  const members = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  const notificationsPromises = [];
  const data = isAcceptedByQuorum ? { permlink: research.permlink } : undefined;

  for (let i = 0; i < members.length; i++) {
    let rgt = members[i];
    let promise = usersNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        isProposalAutoAccepted: true, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("update_research"), data, is_completed: true }, // legacy
        researchGroup,
        research,
        creatorProfile: creator
      }
    });
    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED, async (payload) => {
  const { researchGroup, proposer } = payload;
  const members = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  const notificationsPromises = [];

  for (let i = 0; i < members.length; i++) {
    let rgt = members[i];
    let promise = usersNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("update_account") }, // legacy
        researchGroup,
        creatorProfile: proposer
      }
    });
    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATED, async (payload) => {
  const { researchGroup, creator, isAcceptedByQuorum } = payload;
  const members = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  const notificationsPromises = [];

  for (let i = 0; i < members.length; i++) {
    let rgt = members[i];
    let promise = usersNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        isProposalAutoAccepted: true, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("update_account"), is_completed: true }, // legacy
        researchGroup,
        creatorProfile: creator
      }
    });
    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(APP_EVENTS.RESEARCH_APPLICATION_CREATED, async (payload) => {
  const { research, requester, tenant, proposal } = payload;

  const notificationsPromises = [];

  for (let i = 0; i < tenant.admins.length; i++) {
    let admin = tenant.admins[i];
    let promise = usersNotificationService.createUserNotification({
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


userNotificationHandler.on(APP_EVENTS.RESEARCH_APPLICATION_APPROVED, async (payload) => {
  const { research, researchGroup, requester, approver, tenant } = payload;

  usersNotificationService.createUserNotification({
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


userNotificationHandler.on(APP_EVENTS.RESEARCH_APPLICATION_REJECTED, async (payload) => {
  const { research, requester, rejecter, tenant } = payload;

  usersNotificationService.createUserNotification({
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


userNotificationHandler.on(APP_EVENTS.RESEARCH_APPLICATION_EDITED, async (payload) => {
  const { research, requester, proposal, tenant } = payload;

  const notificationsPromises = [];

  for (let i = 0; i < tenant.admins.length; i++) {
    let admin = tenant.admins[i];
    let promise = usersNotificationService.createUserNotification({
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


userNotificationHandler.on(APP_EVENTS.RESEARCH_APPLICATION_DELETED, async (payload) => {
  const { research, requester, tenant } = payload;

  const notificationsPromises = [];

  for (let i = 0; i < tenant.admins.length; i++) {
    let admin = tenant.admins[i];
    let promise = usersNotificationService.createUserNotification({
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


userNotificationHandler.on(APP_EVENTS.USER_INVITATION_PROPOSED, async (payload) => {
  const { researchGroup, creator, invitee } = payload;

  const notificationsPromises = [];

  const rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);
  for (let i = 0; i < rgtList.length; i++) {
    let rgt = rgtList[i];
    let promise = usersNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { // legacy
          research_group_id: researchGroup.id,
          action: deipRpc.operations.getOperationTag("join_research_group_membership"),
          creator: creator._id,
          data: {
            name: invitee._id
          }
        },
        researchGroup,
        inviteeProfile: invitee,
        creatorProfile: creator
      }
    });

    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(APP_EVENTS.USER_INVITATION_PROPOSAL_SIGNED, async (payload) => {
  const { researchGroup, invite, creator, invitee } = payload;

  if (invite.status == USER_INVITE_STATUS.SENT) {

    const notificationsPromises = [];
    const rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

    for (let i = 0; i < rgtList.length; i++) {
      let rgt = rgtList[i];
      let memberNotificationPromise = usersNotificationService.createUserNotification({
        username: rgt.owner,
        status: 'unread',
        type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
        metadata: {
          proposal: { action: deipRpc.operations.getOperationTag("join_research_group_membership"), is_completed: true }, // legacy
          researchGroup,
          inviteeProfile: invitee,
          creatorProfile: creator
        }
      });

      notificationsPromises.push(memberNotificationPromise);
    }

    const inviteeNotificationPromise = usersNotificationService.createUserNotification({
      username: invitee,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.INVITATION,
      metadata: {
        researchGroup,
        inviteeProfile: invitee
      }
    });

    notificationsPromises.push(inviteeNotificationPromise);

    Promise.all(notificationsPromises);

  } else if (invite.status == USER_INVITE_STATUS.APPROVED) {

    const rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);
    const notificationsPromises = [];

    for (let i = 0; i < rgtList.length; i++) {
      let rgt = rgtList[i];
      if (rgt.owner != invite.invitee) {
        let memberNotificationPromise = usersNotificationService.createUserNotification({
          username: rgt.owner,
          status: 'unread',
          type: USER_NOTIFICATION_TYPE.INVITATION_APPROVED,
          metadata: {
            researchGroup,
            inviteeProfile: invitee
          }
        });
        notificationsPromises.push(memberNotificationPromise);
      }
    }

    Promise.all(notificationsPromises);
  }

});


userNotificationHandler.on(APP_EVENTS.USER_INVITATION_PROPOSAL_REJECTED, async (payload) => {
  const { researchGroup, invite, creator, invitee, approver } = payload;

  const notificationsPromises = [];
  const rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  for (let i = 0; i < rgtList.length; i++) {
    let rgt = rgtList[i];
    let memberNotificationPromise = usersNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.INVITATION_REJECTED,
      metadata: {
        researchGroup,
        inviteeProfile: invitee
      }
    });
    notificationsPromises.push(memberNotificationPromise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(APP_EVENTS.USER_RESIGNATION_PROPOSED, async (event) => {
  const { researchGroup, member, creator } = event;

  const notificationsPromises = [];
  const rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  for (let i = 0; i < rgtList.length; i++) {
    let rgt = rgtList[i];
    let memberNotificationPromise = usersNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("leave_research_group_membership"), data: { name: member._id } }, // legacy
        researchGroup,
        excludedProfile: member,
        creatorProfile: creator
      }
    });
    notificationsPromises.push(memberNotificationPromise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(APP_EVENTS.USER_RESIGNATION_PROPOSAL_SIGNED, async (event) => {
  const { researchGroup, member, creator } = event;

  const notificationsPromises = [];
  const rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  for (let i = 0; i < rgtList.length; i++) {
    let rgt = rgtList[i];
    let memberNotificationPromise = usersNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        isProposalAutoAccepted: true, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("leave_research_group_membership"), data: { name: member._id } }, // legacy
        researchGroup,
        excludedProfile: member,
        creatorProfile: creator
      }
    });

    notificationsPromises.push(memberNotificationPromise);
  }

  notificationsPromises.push(usersNotificationService.createUserNotification({
    username: member._id,
    status: 'unread',
    type: USER_NOTIFICATION_TYPE.EXCLUSION_APPROVED,
    metadata: {
      researchGroup,
      excludedProfile: member
    }
  }));

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSED, async (payload) => {
  const { researchGroup, research, proposer, tokenSale } = payload;
  const members = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  const notificationsPromises = [];
  for (let i = 0; i < members.length; i++) {
    let rgt = members[i];
    let memberNotificationPromise = usersNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL, // legacy
      metadata: {
        isProposalAutoAccepted: false, // legacy
        proposal: { action: deipRpc.operations.getOperationTag("create_research_token_sale"), data: { research_id: research.id } }, // legacy
        researchGroup,
        research,
        tokenSale,
        creatorProfile: proposer
      }
    });
    notificationsPromises.push(memberNotificationPromise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_CREATED, async (payload) => {
  const { researchGroup, research, creator, tokenSale } = payload;
  const members = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  const notificationsPromises = [];
  for (let i = 0; i < members.length; i++) {
    let rgt = members[i];
    let memberNotificationPromise = usersNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type: USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, // legacy
      metadata: {
        proposal: { action: deipRpc.operations.getOperationTag("create_research_token_sale"), data: { research_id: research.id }, is_completed: true }, // legacy
        researchGroup,
        research,
        tokenSale,
        creatorProfile: creator
      }
    });
    notificationsPromises.push(memberNotificationPromise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(APP_EVENTS.RESEARCH_CONTENT_EXPERT_REVIEW_CREATED, async (source) => {
  const type = USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW;
  const { event: reviewCreatedEvent, tenant } = source;
  const researchContentService = new ResearchContentService();
  const reviewService = new ReviewService();

  const { reviewExternalId, researchContentExternalId, author } = reviewCreatedEvent.getSourceData();

  let reviewerProfile = await usersService.findUserProfileByOwner(author);
  let researchContent = await researchContentService.getResearchContent(researchContentExternalId);

  let research = await deipRpc.api.getResearchByIdAsync(researchContent.research_id);
  let review = await reviewService.getReview(reviewExternalId);

  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(research.research_group_id);
  let rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);
  let notificationsPromises = [];

  for (let i = 0; i < rgtList.length; i++) {
    const rgt = rgtList[i];
    let promise = usersNotificationService.createUserNotification({
      username: rgt.owner,
      status: 'unread',
      type,
      metadata: {
        review,
        researchContent,
        research,
        researchGroup,
        reviewerProfile
      }
    });
    notificationsPromises.push(promise);
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW_REQUEST, async ({ requestor, expert, contentId }) => {
  const type = USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW_REQUEST;
  const researchContentService = new ResearchContentService();

  let requestorProfile = await usersService.findUserProfileByOwner(requestor);
  let expertProfile = await usersService.findUserProfileByOwner(expert);
  let content = await deipRpc.api.getResearchContentByIdAsync(contentId);
  let researchContent = await researchContentService.getResearchContent(content.external_id);

  let research = await deipRpc.api.getResearchByIdAsync(researchContent.research_id);
  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(research.research_group_id);

  usersNotificationService.createUserNotification({
    username: expert,
    status: 'unread',
    type,
    metadata: {
      requestorProfile,
      expertProfile,
      researchGroup,
      research,
      researchContent
    }
  });
});


userNotificationHandler.on(USER_NOTIFICATION_TYPE.EXPERTISE_ALLOCATED, async (expertiseProposal) => {
  const type = USER_NOTIFICATION_TYPE.EXPERTISE_ALLOCATED;
  let { claimer } = expertiseProposal;
  let claimerProfile = await usersService.findUserProfileByOwner(claimer);

  usersNotificationService.createUserNotification({
    username: claimer,
    status: 'unread',
    type,
    metadata: {
      expertiseProposal,
      claimerProfile
    }
  });
});

export default userNotificationHandler;