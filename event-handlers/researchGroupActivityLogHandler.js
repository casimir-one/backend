import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { APP_EVENTS, ACTIVITY_LOG_TYPE, USER_INVITE_STATUS } from './../constants';
import activityLogEntriesService from './../services/activityLogEntry';
import usersService from './../services/users';

class ResearchGroupActivityLogHandler extends EventEmitter {}

const researchGroupActivityLogHandler = new ResearchGroupActivityLogHandler();

researchGroupActivityLogHandler.on(APP_EVENTS.RESEARCH_PROPOSED, async (payload) => {
  const { researchGroup, proposer, researchTitle } = payload;
  const data = { title: researchTitle };

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId: researchGroup.id,
    type: ACTIVITY_LOG_TYPE.PROPOSAL, // legacy
    metadata: {
      isProposalAutoAccepted: false, // legacy
      proposal: { action: deipRpc.operations.getOperationTag("create_research"), data }, // legacy
      researchGroup,
      research: null,
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


researchGroupActivityLogHandler.on(APP_EVENTS.RESEARCH_CONTENT_PROPOSED, async (payload) => {
  const { researchGroup, research, proposer, title } = payload;
  const data = { title };

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId: researchGroup.id,
    type: ACTIVITY_LOG_TYPE.PROPOSAL, // legacy
    metadata: {
      isProposalAutoAccepted: false, // legacy
      proposal: { action: deipRpc.operations.getOperationTag("create_research_content"), data }, // legacy
      researchGroup,
      research,
      researchContent: null,
      creatorProfile: proposer
    }
  });
});


researchGroupActivityLogHandler.on(APP_EVENTS.RESEARCH_CONTENT_CREATED, async (payload) => {
  const { researchGroup, research, researchContent, creator } = payload;

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId: researchGroup.id,
    type: ACTIVITY_LOG_TYPE.PROPOSAL_ACCEPTED, // legacy
    metadata: {
      isProposalAutoAccepted: true, // legacy
      proposal: { action: deipRpc.operations.getOperationTag("create_research_content") }, // legacy
      researchGroup,
      research,
      researchContent,
      creatorProfile: creator
    }
  });
});


researchGroupActivityLogHandler.on(APP_EVENTS.RESEARCH_UPDATE_PROPOSED, async (payload) => {
  const { researchGroup, research, proposer } = payload;
  const data = { permlink: research.permlink };

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId: researchGroup.id,
    type: ACTIVITY_LOG_TYPE.PROPOSAL, // legacy
    metadata: {
      isProposalAutoAccepted: false, // legacy
      proposal: { action: deipRpc.operations.getOperationTag("update_research"), data }, // legacy
      researchGroup,
      research,
      creatorProfile: proposer
    }
  });
});


researchGroupActivityLogHandler.on(APP_EVENTS.RESEARCH_UPDATED, async (payload) => {
  const { researchGroup, research, creator } = payload;
  const data = { permlink: research.permlink };

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId: researchGroup.id,
    type: ACTIVITY_LOG_TYPE.PROPOSAL_ACCEPTED, // legacy
    metadata: {
      isProposalAutoAccepted: true, // legacy
      proposal: { action: deipRpc.operations.getOperationTag("update_research"), data }, // legacy
      researchGroup,
      research,
      creatorProfile: creator
    }
  });
});


researchGroupActivityLogHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED, async (payload) => {
  const { researchGroup, proposer } = payload;

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId: researchGroup.id,
    type: ACTIVITY_LOG_TYPE.PROPOSAL, // legacy
    metadata: {
      isProposalAutoAccepted: false, // legacy
      proposal: { action: deipRpc.operations.getOperationTag("update_account") }, // legacy
      researchGroup,
      creatorProfile: proposer
    }
  });
});


researchGroupActivityLogHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATED, async (payload) => {
  const { researchGroup, creator } = payload;

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId: researchGroup.id,
    type: ACTIVITY_LOG_TYPE.PROPOSAL, // legacy
    metadata: {
      isProposalAutoAccepted: true, // legacy
      proposal: { action: deipRpc.operations.getOperationTag("update_account") }, // legacy
      researchGroup,
      creatorProfile: creator
    }
  });
});


researchGroupActivityLogHandler.on(APP_EVENTS.USER_INVITATION_PROPOSED, async (payload) => {
  const { researchGroup, creator, invitee } = payload;

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId: researchGroup.id,
    type: ACTIVITY_LOG_TYPE.PROPOSAL, // legacy frontend type
    metadata: {
      isProposalAutoAccepted: false,
      proposal: { // legacy frontend object
        research_group_id: researchGroup.id,
        action: deipRpc.operations.getOperationTag("join_research_group_membership"),
        creator: creator._id,
        data: {
          name: invitee._id
        },
        isProposalAutoAccepted: false
      },
      researchGroup,
      inviteeProfile: invitee,
      creatorProfile: creator
    }
  });

});


researchGroupActivityLogHandler.on(APP_EVENTS.USER_INVITATION_SIGNED, async (payload) => {
  const { researchGroup, invite, creator, invitee } = payload;

  if (invite.status == USER_INVITE_STATUS.APPROVED) {
    activityLogEntriesService.createActivityLogEntry({
      researchGroupId: researchGroup.id,
      type: ACTIVITY_LOG_TYPE.INVITATION_APPROVED,
      metadata: {
        proposal: { action: deipRpc.operations.getOperationTag("join_research_group_membership") }, // legacy,
        researchGroup,
        inviteeProfile: invitee,
        creatorProfile: creator
      }
    });
  }
});


researchGroupActivityLogHandler.on(APP_EVENTS.USER_INVITATION_CANCELED, async (payload) => {
  const { researchGroup, invitee, invite } = payload;

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId: researchGroup.id,
    type: ACTIVITY_LOG_TYPE.INVITATION_REJECTED,
    metadata: {
      invite,
      researchGroup,
      inviteeProfile: invitee
    }
  });
});



researchGroupActivityLogHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSED, async (payload) => {
  const { researchGroup, tokenSale, research, proposer } = payload;

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId: researchGroup.id,
    type: ACTIVITY_LOG_TYPE.PROPOSAL, // legacy
    metadata: {
      isProposalAutoAccepted: true, // legacy
      proposal: { action: deipRpc.operations.getOperationTag("create_research_token_sale"), data: { research_id: research.id } }, // legacy
      researchGroup,
      research,
      tokenSale,
      creatorProfile: proposer
    }
  });
});



researchGroupActivityLogHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_CREATED, async (payload) => {
  const { researchGroup, tokenSale, research, creator } = payload;

  activityLogEntriesService.createActivityLogEntry({
    researchGroupId: researchGroup.id,
    type: ACTIVITY_LOG_TYPE.PROPOSAL_ACCEPTED, // legacy
    metadata: {
      proposal: { action: deipRpc.operations.getOperationTag("create_research_token_sale"), data: { research_id: research.id } }, // legacy
      researchGroup,
      research,
      tokenSale,
      creatorProfile: creator
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