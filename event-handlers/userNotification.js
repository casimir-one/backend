import EventEmitter from 'events';
import deipRpc from '@deip/deip-oa-rpc-client';
import PROPOSAL_TYPE from './../constants/proposalType';
import USER_NOTIFICATION_TYPE from './../constants/userNotificationType';
import TOKEN_SALE_STATUS from './../constants/tokenSaleStatus';
import usersService from './../services/users';
import * as usersNotificationService from './../services/userNotification';

class UserNotificationHandler extends EventEmitter { }

const userNotificationHandler = new UserNotificationHandler();

// TODO: split this event handler on specific proposal types and broadcast specific events from chain event emitter
userNotificationHandler.on(USER_NOTIFICATION_TYPE.PROPOSAL, async (proposal) => {
  const type = USER_NOTIFICATION_TYPE.PROPOSAL;
  let { research_group_id: researchGroupId, action, creator, data } = proposal;
  let payload = data;

  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(researchGroupId);
  let rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);
  let creatorProfile = await usersService.findUserProfileByOwner(creator);
  let isProposalAutoAccepted = researchGroup.is_dao === false;
  
  let notificationsPromises = [];

  switch (action) {

    case PROPOSAL_TYPE.START_RESEARCH: {

      let { permlink } = payload;
      let research = null;
      
      if (isProposalAutoAccepted) {
        research = await deipRpc.api.getResearchByAbsolutePermlinkAsync(researchGroup.permlink, permlink);
      }

      for (let i = 0; i < rgtList.length; i++) {
        let rgt = rgtList[i];
        let promise = usersNotificationService.createUserNotification({
          username: rgt.owner,
          status: 'unread',
          type,
          metadata: {
            isProposalAutoAccepted,
            proposal,
            researchGroup,
            research,
            creatorProfile
          }
        });
        notificationsPromises.push(promise);
      }

      break;
    }

    case PROPOSAL_TYPE.CREATE_RESEARCH_MATERIAL: {
      let { permlink, research_id } = payload;
      let research = await deipRpc.api.getResearchByIdAsync(research_id);
      let researchContent = null;

      if (isProposalAutoAccepted) {
        researchContent = await deipRpc.api.getResearchContentByAbsolutePermlinkAsync(researchGroup.permlink, research.permlink, permlink);
      }

      for (let i = 0; i < rgtList.length; i++) {
        let rgt = rgtList[i];
        let promise = usersNotificationService.createUserNotification({
          username: rgt.owner,
          status: 'unread',
          type,
          metadata: {
            isProposalAutoAccepted,
            proposal,
            researchGroup,
            research,
            researchContent,
            creatorProfile
          }
        });
        notificationsPromises.push(promise);
      }

      break;
    }

    case PROPOSAL_TYPE.START_RESEARCH_TOKEN_SALE: {
      let { research_id } = payload;
      let research = await deipRpc.api.getResearchByIdAsync(research_id);
      let tokenSale = null;

      if (isProposalAutoAccepted) {
        let list = await deipRpc.api.getResearchTokenSalesByResearchIdAsync(research_id);
        tokenSale = list.find(ts => ts.status == TOKEN_SALE_STATUS.ACTIVE || ts.status == TOKEN_SALE_STATUS.INACTIVE);
      }

      for (let i = 0; i < rgtList.length; i++) {
        let rgt = rgtList[i];
        let promise = usersNotificationService.createUserNotification({
          username: rgt.owner,
          status: 'unread',
          type,
          metadata: {
            isProposalAutoAccepted,
            proposal,
            researchGroup,
            research,
            tokenSale,
            creatorProfile
          }
        });
        notificationsPromises.push(promise);
      }

      break;
    }

    case PROPOSAL_TYPE.INVITE_MEMBER: {
      let { name } = payload;
      let inviteeProfile = await usersService.findUserProfileByOwner(name);

      for (let i = 0; i < rgtList.length; i++) {
        let rgt = rgtList[i];
        let promise = usersNotificationService.createUserNotification({
          username: rgt.owner,
          status: 'unread',
          type,
          metadata: {
            isProposalAutoAccepted,
            proposal,
            researchGroup,
            inviteeProfile,
            creatorProfile
          }
        });
        notificationsPromises.push(promise);
      }

      if (isProposalAutoAccepted) {
        // TODO: this event should be fired by chain event emmiter
        userNotificationHandler.emit(USER_NOTIFICATION_TYPE.INVITATION, { invitee: name, researchGroupId: researchGroup.id });
      }

      break;
    }

    case PROPOSAL_TYPE.DROPOUT_MEMBER: {
      let { name } = payload;
      let excludedProfile = await usersService.findUserProfileByOwner(name);

      for (let i = 0; i < rgtList.length; i++) {
        let rgt = rgtList[i];
        let promise = usersNotificationService.createUserNotification({
          username: rgt.owner,
          status: 'unread',
          type,
          metadata: {
            isProposalAutoAccepted,
            proposal,
            researchGroup,
            excludedProfile,
            creatorProfile
          }
        });
        notificationsPromises.push(promise);
      }

      if (isProposalAutoAccepted) {
        // TODO: this event should be fired by chain event emmiter
        userNotificationHandler.emit(USER_NOTIFICATION_TYPE.EXCLUSION_APPROVED, { excluded: name, researchGroupId: researchGroup.id });
      }

      break;
    }

    case PROPOSAL_TYPE.CHANGE_RESEARCH_META_DATA_TYPE: {
      let { permlink, research_id } = payload;
      let research = await deipRpc.api.getResearchByIdAsync(research_id);
      let researchContent = null;

      if (isProposalAutoAccepted) {
        researchContent = await deipRpc.api.getResearchContentByAbsolutePermlinkAsync(researchGroup.permlink, research.permlink, permlink);
      }

      for (let i = 0; i < rgtList.length; i++) {
        let rgt = rgtList[i];
        let promise = usersNotificationService.createUserNotification({
          username: rgt.owner,
          status: 'unread',
          type,
          metadata: {
            isProposalAutoAccepted,
            proposal,
            researchGroup,
            research,
            researchContent,
            creatorProfile
          }
        });
        notificationsPromises.push(promise);
      }

      break;
    }

    default: {
      break;
    }
  }

  Promise.all(notificationsPromises);

});


// TODO: split this event handler on specific proposal types and broadcast specific events from chain event emitter
userNotificationHandler.on(USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED, async (proposal) => {
  const type = USER_NOTIFICATION_TYPE.PROPOSAL_ACCEPTED;
  let { research_group_id: researchGroupId, action, creator, data } = proposal;
  let payload = data;
  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(researchGroupId);
  let creatorProfile = await usersService.findUserProfileByOwner(creator);
  let rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroup.id);

  let notificationsPromises = [];

  switch (action) {

    case PROPOSAL_TYPE.START_RESEARCH: {
      let { permlink } = payload;
      let research = await deipRpc.api.getResearchByAbsolutePermlinkAsync(researchGroup.permlink, permlink);

      for (let i = 0; i < rgtList.length; i++) {
        let rgt = rgtList[i];
        let promise = usersNotificationService.createUserNotification({
          username: rgt.owner,
          status: 'unread',
          type,
          metadata: {
            proposal,
            researchGroup,
            research,
            creatorProfile
          }
        });
        notificationsPromises.push(promise);
      }

      break;
    }

    case PROPOSAL_TYPE.CREATE_RESEARCH_MATERIAL: {
      let { permlink, research_id } = payload;
      let research = await deipRpc.api.getResearchByIdAsync(research_id);
      let researchContent = await deipRpc.api.getResearchContentByAbsolutePermlinkAsync(researchGroup.permlink, research.permlink, permlink);

      for (let i = 0; i < rgtList.length; i++) {
        let rgt = rgtList[i];
        let promise = usersNotificationService.createUserNotification({
          username: rgt.owner,
          status: 'unread',
          type,
          metadata: {
            proposal,
            researchGroup,
            research,
            researchContent,
            creatorProfile
          }
        });
        notificationsPromises.push(promise);
      }

      break;
    }

    case PROPOSAL_TYPE.START_RESEARCH_TOKEN_SALE: {
      let { research_id } = payload;
      let research = await deipRpc.api.getResearchByIdAsync(research_id);
      let list = await deipRpc.api.getResearchTokenSalesByResearchIdAsync(research_id);
      let tokenSale = list.find(ts => ts.status == TOKEN_SALE_STATUS.ACTIVE || ts.status == TOKEN_SALE_STATUS.INACTIVE);

      for (let i = 0; i < rgtList.length; i++) {
        let rgt = rgtList[i];
        let promise = usersNotificationService.createUserNotification({
          username: rgt.owner,
          status: 'unread',
          type,
          metadata: {
            proposal,
            researchGroup,
            research,
            tokenSale,
            creatorProfile
          }
        });
        notificationsPromises.push(promise);
      }

      break;
    }

    case PROPOSAL_TYPE.INVITE_MEMBER: {
      let { name } = payload;
      let inviteeProfile = await usersService.findUserProfileByOwner(name);

      for (let i = 0; i < rgtList.length; i++) {
        let rgt = rgtList[i];
        let promise = usersNotificationService.createUserNotification({
          username: rgt.owner,
          status: 'unread',
          type,
          metadata: {
            proposal,
            researchGroup,
            inviteeProfile,
            creatorProfile
          }
        });
        notificationsPromises.push(promise);
      }

      // TODO: this event should be fired by chain event emmiter
      userNotificationHandler.emit(USER_NOTIFICATION_TYPE.INVITATION, { invitee: name, researchGroupId: researchGroup.id });

      break;
    }

    case PROPOSAL_TYPE.DROPOUT_MEMBER: {
      let { name } = payload;
      let excludedProfile = await usersService.findUserProfileByOwner(name);

      for (let i = 0; i < rgtList.length; i++) {
        let rgt = rgtList[i];
        let promise = usersNotificationService.createUserNotification({
          username: rgt.owner,
          status: 'unread',
          type,
          metadata: {
            proposal,
            researchGroup,
            excludedProfile,
            creatorProfile
          }
        });
        notificationsPromises.push(promise);
      }

      // TODO: this event should be fired by chain event emmiter
      userNotificationHandler.emit(USER_NOTIFICATION_TYPE.EXCLUSION_APPROVED, { excluded: name, researchGroupId: researchGroup.id });

      break;
    }

    default: {
      break;
    }
  }

  Promise.all(notificationsPromises);

});


userNotificationHandler.on(USER_NOTIFICATION_TYPE.INVITATION, async ({ invitee, researchGroupId }) => {
  const type = USER_NOTIFICATION_TYPE.INVITATION;

  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(researchGroupId);
  let inviteeProfile = await usersService.findUserProfileByOwner(invitee);

  usersNotificationService.createUserNotification({
    username: invitee,
    status: 'unread',
    type,
    metadata: {
      researchGroup,
      inviteeProfile
    }
  });
});

userNotificationHandler.on(USER_NOTIFICATION_TYPE.EXCLUSION_APPROVED, async ({ excluded, researchGroupId }) => {
  const type = USER_NOTIFICATION_TYPE.EXCLUSION_APPROVED;

  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(researchGroupId);
  let excludedProfile = await usersService.findUserProfileByOwner(excluded);

  usersNotificationService.createUserNotification({
    username: excluded,
    status: 'unread',
    type,
    metadata: {
      researchGroup,
      excludedProfile
    }
  });
});


userNotificationHandler.on(USER_NOTIFICATION_TYPE.INVITATION_APPROVED, async (invite) => {
  const type = USER_NOTIFICATION_TYPE.INVITATION_APPROVED;
  let { research_group_id: researchGroupId, account_name: invitee } = invite;

  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(researchGroupId);
  let inviteeProfile = await usersService.findUserProfileByOwner(invitee);
  let rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroupId);
  let notificationsPromises = [];

  for (let i = 0; i < rgtList.length; i++) {
    let rgt = rgtList[i];
    if (rgt.owner != invitee) {
      let promise = usersNotificationService.createUserNotification({
        username: rgt.owner,
        status: 'unread',
        type,
        metadata: {
          researchGroup,
          inviteeProfile
        }
      });
      notificationsPromises.push(promise);
    }
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(USER_NOTIFICATION_TYPE.INVITATION_REJECTED, async (invite) => {
  const type = USER_NOTIFICATION_TYPE.INVITATION_REJECTED;
  let { research_group_id: researchGroupId, account_name: invitee } = invite;

  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(researchGroupId);
  let inviteeProfile = await usersService.findUserProfileByOwner(invitee);
  let rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroupId);
  let notificationsPromises = [];

  for (let i = 0; i < rgtList.length; i++) {
    let rgt = rgtList[i];
    if (rgt.owner != invitee) {
      let promise = usersNotificationService.createUserNotification({
        username: rgt.owner,
        status: 'unread',
        type,
        metadata: {
          researchGroup,
          inviteeProfile
        }
      });
      notificationsPromises.push(promise);
    }
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(USER_NOTIFICATION_TYPE.INVITATION_REJECTED, async (invite) => {
  const type = USER_NOTIFICATION_TYPE.INVITATION_REJECTED;
  let { research_group_id: researchGroupId, account_name: invitee } = invite;

  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(researchGroupId);
  let inviteeProfile = await usersService.findUserProfileByOwner(invitee);
  let rgtList = await deipRpc.api.getResearchGroupTokensByResearchGroupAsync(researchGroupId);
  let notificationsPromises = [];

  for (let i = 0; i < rgtList.length; i++) {
    let rgt = rgtList[i];
    if (rgt.owner != invitee) {
      let promise = usersNotificationService.createUserNotification({
        username: rgt.owner,
        status: 'unread',
        type,
        metadata: {
          researchGroup,
          inviteeProfile
        }
      });
      notificationsPromises.push(promise);
    }
  }

  Promise.all(notificationsPromises);
});


userNotificationHandler.on(USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW, async (review) => {
  const type = USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW;
  let { author, research_content_id: researchContentId } = review;

  let reviewerProfile = await usersService.findUserProfileByOwner(author);
  let researchContent = await deipRpc.api.getResearchContentByIdAsync(researchContentId);
  let research = await deipRpc.api.getResearchByIdAsync(researchContent.research_id);
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


userNotificationHandler.on(USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW, async (review) => {
  const type = USER_NOTIFICATION_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW;
  let { author, research_content_id: researchContentId } = review;

  let reviewerProfile = await usersService.findUserProfileByOwner(author);
  let researchContent = await deipRpc.api.getResearchContentByIdAsync(researchContentId);
  let research = await deipRpc.api.getResearchByIdAsync(researchContent.research_id);
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

  let requestorProfile = await usersService.findUserProfileByOwner(requestor);
  let expertProfile = await usersService.findUserProfileByOwner(expert);
  let researchContent = await deipRpc.api.getResearchContentByIdAsync(contentId);
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