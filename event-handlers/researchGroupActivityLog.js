import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { APP_EVENTS, PROPOSAL_TYPE, ACTIVITY_LOG_TYPE, TOKEN_SALE_STATUS } from './../constants';
import activityLogEntriesService from './../services/activityLogEntry';
import usersService from './../services/users';

class ResearchGroupActivityLogHandler extends EventEmitter {}

const researchGroupActivityLogHandler = new ResearchGroupActivityLogHandler();

researchGroupActivityLogHandler.on(APP_EVENTS.RESEARCH_PROPOSED, async (payload) => {
  const { researchGroup, research, proposer, title, isProposalAutoAccepted } = payload;

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId: researchGroup.id,
    type: ACTIVITY_LOG_TYPE.PROPOSAL, // legacy
    metadata: {
      isProposalAutoAccepted, // legacy
      proposal: { action: deipRpc.operations.getOperationTag("create_research"), data: { title } }, // legacy
      researchGroup,
      research,
      creatorProfile: proposer
    }
  });
});


researchGroupActivityLogHandler.on(APP_EVENTS.RESEARCH_CREATED, async (payload) => {
  const { researchGroup, research, creator } = payload;

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId: researchGroup.id,
    type: ACTIVITY_LOG_TYPE.PROPOSAL_ACCEPTED, // legacy
    metadata: {
      isProposalAutoAccepted: true, // legacy
      proposal: { action: deipRpc.operations.getOperationTag("create_research") }, // legacy
      researchGroup,
      research,
      creatorProfile: creator
    }
  });
});



// TODO: split this event handler on specific proposal types and broadcast specific events from chain event emitter
researchGroupActivityLogHandler.on(ACTIVITY_LOG_TYPE.PROPOSAL, async (proposal) => {
  const type = ACTIVITY_LOG_TYPE.PROPOSAL;
  let { research_group_id: researchGroupId, action, creator, data, isProposalAutoAccepted } = proposal;
  let payload = data;
  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(researchGroupId);
  let creatorProfile = await usersService.findUserProfileByOwner(creator);

  switch (action) {

    case PROPOSAL_TYPE.CREATE_RESEARCH_MATERIAL: {
      let { permlink, research_id } = payload;
      let research = await deipRpc.api.getResearchByIdAsync(research_id);
      let researchContent = null;

      if (isProposalAutoAccepted) {
        researchContent = await deipRpc.api.getResearchContentByAbsolutePermlinkAsync(researchGroup.permlink, research.permlink, permlink);
      }

      activityLogEntriesService.createActivityLogEntry({
        researchGroupId,
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

      break;
    }

    case PROPOSAL_TYPE.CREATE_RESEARCH_TOKEN_SALE: {
      let { research_id } = payload;
      let research = await deipRpc.api.getResearchByIdAsync(research_id);
      let tokenSale = null;

      if (isProposalAutoAccepted) {
        let list = await deipRpc.api.getResearchTokenSalesByResearchIdAsync(research_id);
        tokenSale = list.find(ts => ts.status == TOKEN_SALE_STATUS.ACTIVE || ts.status == TOKEN_SALE_STATUS.INACTIVE);
      }

      activityLogEntriesService.createActivityLogEntry({
        researchGroupId,
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

      break;
    }

    case PROPOSAL_TYPE.INVITE_MEMBER: {
      let { name } = payload;
      let inviteeProfile = await usersService.findUserProfileByOwner(name);

      activityLogEntriesService.createActivityLogEntry({
        researchGroupId,
        type,
        metadata: {
          isProposalAutoAccepted,
          proposal,
          researchGroup,
          inviteeProfile,
          creatorProfile
        }
      });

      break;
    }

    default: {
      break;
    }
  }
});

// TODO: split this event handler on specific proposal types and broadcast specific events from chain event emitter
researchGroupActivityLogHandler.on(ACTIVITY_LOG_TYPE.PROPOSAL_ACCEPTED, async (proposal) => {
  const type = ACTIVITY_LOG_TYPE.PROPOSAL_ACCEPTED;
  let { research_group_id: researchGroupId, action, creator, data } = proposal;
  let payload = data;
  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(researchGroupId);
  let creatorProfile = await usersService.findUserProfileByOwner(creator);

  switch (action) {

    case PROPOSAL_TYPE.CREATE_RESEARCH: {
      let { permlink } = payload;
      let research = await deipRpc.api.getResearchByAbsolutePermlinkAsync(researchGroup.permlink, permlink);

      activityLogEntriesService.createActivityLogEntry({
        researchGroupId,
        type,
        metadata: {
          proposal,
          researchGroup,
          research,
          creatorProfile
        }
      });

      break;
    }

    case PROPOSAL_TYPE.CREATE_RESEARCH_MATERIAL: {
      let { permlink, research_id } = payload;
      let research = await deipRpc.api.getResearchByIdAsync(research_id);
      let researchContent = await deipRpc.api.getResearchContentByAbsolutePermlinkAsync(researchGroup.permlink, research.permlink, permlink);

      activityLogEntriesService.createActivityLogEntry({
        researchGroupId,
        type,
        metadata: {
          proposal,
          researchGroup,
          research,
          researchContent,
          creatorProfile
        }
      });

      break;
    }

    case PROPOSAL_TYPE.CREATE_RESEARCH_TOKEN_SALE: {
      let { research_id } = payload;
      let research = await deipRpc.api.getResearchByIdAsync(research_id);
      let list = await deipRpc.api.getResearchTokenSalesByResearchIdAsync(research_id);
      let tokenSale = list.find(ts => ts.status == TOKEN_SALE_STATUS.ACTIVE || ts.status == TOKEN_SALE_STATUS.INACTIVE);

      activityLogEntriesService.createActivityLogEntry({
        researchGroupId,
        type,
        metadata: {
          proposal,
          researchGroup,
          research,
          tokenSale,
          creatorProfile
        }
      });

      break;
    }

    case PROPOSAL_TYPE.INVITE_MEMBER: {
      let { name } = payload;
      let inviteeProfile = await usersService.findUserProfileByOwner(name);

      activityLogEntriesService.createActivityLogEntry({
        researchGroupId,
        type,
        metadata: {
          proposal,
          researchGroup,
          inviteeProfile,
          creatorProfile
        }
      });

      break;
    }

    default: {
      break;
    }
  }
});

researchGroupActivityLogHandler.on(ACTIVITY_LOG_TYPE.PROPOSAL_VOTE, async ({ voter, proposal }) => {
  const type = ACTIVITY_LOG_TYPE.PROPOSAL_VOTE;
  let { research_group_id: researchGroupId, action, data } = proposal;
  
  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(researchGroupId);
  let voterProfile = await usersService.findUserProfileByOwner(voter);
  let research = null;
  let inviteeProfile = null;
  
  if (action == PROPOSAL_TYPE.CREATE_RESEARCH_MATERIAL || action == PROPOSAL_TYPE.CREATE_RESEARCH_TOKEN_SALE) {
    research = await deipRpc.api.getResearchByIdAsync(data.research_id);
  }

  if (action == PROPOSAL_TYPE.INVITE_MEMBER) {
    inviteeProfile = await usersService.findUserProfileByOwner(data.name);
  }

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId,
    type,
    metadata: {
      proposal,
      researchGroup,
      research,
      inviteeProfile,
      voterProfile,
    }
  });
});

researchGroupActivityLogHandler.on(ACTIVITY_LOG_TYPE.INVITATION_APPROVED, async (invite) => {
  const type = ACTIVITY_LOG_TYPE.INVITATION_APPROVED;
  let { researchGroupId, invitee } = invite;

  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(researchGroupId);
  let inviteeProfile = await usersService.findUserProfileByOwner(invitee);
  
  activityLogEntriesService.createActivityLogEntry({
    researchGroupId,
    type,
    metadata: {
      invite,
      researchGroup,
      inviteeProfile
    }
  });
});

researchGroupActivityLogHandler.on(ACTIVITY_LOG_TYPE.INVITATION_REJECTED, async (invite) => {
  const type = ACTIVITY_LOG_TYPE.INVITATION_REJECTED;
  let { researchGroupId, invitee } = invite;

  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(researchGroupId);
  let inviteeProfile = await usersService.findUserProfileByOwner(invitee);

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId,
    type,
    metadata: {
      invite,
      researchGroup,
      inviteeProfile
    }
  });
});

researchGroupActivityLogHandler.on(ACTIVITY_LOG_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW, async (review) => {
  const type = ACTIVITY_LOG_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW;
  let { author, research_content_id: researchContentId } = review;

  let reviewerProfile = await usersService.findUserProfileByOwner(author);
  let researchContent = await deipRpc.api.getResearchContentByIdAsync(researchContentId);
  let research = await deipRpc.api.getResearchByIdAsync(researchContent.research_id);
  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(research.research_group_id);

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId: researchGroup.id,
    type,
    metadata: {
      review,
      researchGroup,
      research,
      researchContent,
      reviewerProfile
    }
  });
});

researchGroupActivityLogHandler.on(ACTIVITY_LOG_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW_REQUEST, async (expertReviewRequest) => {
  const type = ACTIVITY_LOG_TYPE.RESEARCH_CONTENT_EXPERT_REVIEW_REQUEST;
  let { expert, requestor, contentId: researchContentId } = expertReviewRequest;

  let expertProfile = await usersService.findUserProfileByOwner(expert);
  let requestorProfile = await usersService.findUserProfileByOwner(requestor);
  let researchContent = await deipRpc.api.getResearchContentByIdAsync(researchContentId);
  let research = await deipRpc.api.getResearchByIdAsync(researchContent.research_id);
  let researchGroup = await deipRpc.api.getResearchGroupByIdAsync(research.research_group_id);

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId: researchGroup.id,
    type,
    metadata: {
      expertReviewRequest,
      researchGroup,
      research,
      researchContent,
      expertProfile,
      requestorProfile
    }
  });
});


export default researchGroupActivityLogHandler;