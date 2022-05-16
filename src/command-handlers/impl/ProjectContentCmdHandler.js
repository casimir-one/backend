import { APP_CMD } from '@deip/constants';
import BaseCmdHandler from './../base/BaseCmdHandler';
import {
  ProjectContentDraftCreatedEvent,
  ProjectContentDraftDeletedEvent,
  ProjectContentDraftUpdatedEvent,
  ProjectContentCreatedEvent,
  ProjectContentStatusUpdatedEvent,
  ProjectContentMetadataUpdatedEvent,
} from './../../events';

class ProjectContentCmdHandler extends BaseCmdHandler {

  constructor() {
    super();
  }

}

const projectContentCmdHandler = new ProjectContentCmdHandler();

projectContentCmdHandler.register(APP_CMD.CREATE_DRAFT, (cmd, ctx) => {

  const draftData = cmd.getCmdPayload();
  
  ctx.state.appEvents.push(new ProjectContentDraftCreatedEvent({ ...draftData, uploadedFiles: ctx.req.files }));
});

projectContentCmdHandler.register(APP_CMD.UPDATE_DRAFT, (cmd, ctx) => {

  const draftData = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectContentDraftUpdatedEvent({ ...draftData, uploadedFiles: ctx.req.files }));
});

projectContentCmdHandler.register(APP_CMD.DELETE_DRAFT, (cmd, ctx) => {

  const { draftId } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectContentDraftDeletedEvent({ draftId }));
});

projectContentCmdHandler.register(APP_CMD.CREATE_PROJECT_CONTENT, (cmd, ctx) => {

  const projectContent = cmd.getCmdPayload();
  const portalModeration = ctx.state.portal.profile.settings.moderation;
  ctx.state.appEvents.push(new ProjectContentCreatedEvent({
    ...projectContent,
    creator: ctx.state.user.username,
    moderationRequired: !!portalModeration?.projectContentModerationRequired,
  }));
});

projectContentCmdHandler.register(APP_CMD.UPDATE_PROJECT_CONTENT_STATUS, (cmd, ctx) => {

  const { status, _id } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectContentStatusUpdatedEvent({ status, _id }));
});

projectContentCmdHandler.register(APP_CMD.UPDATE_PROJECT_CONTENT_METADATA, (cmd, ctx) => {

  const { metadata, _id } = cmd.getCmdPayload();

  ctx.state.appEvents.push(new ProjectContentMetadataUpdatedEvent({ metadata, _id }));
});

module.exports = projectContentCmdHandler;