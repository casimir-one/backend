
import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { APP_EVENTS, PROPOSAL_TYPE, RESEARCH_CONTENT_STATUS } from './../constants';
import userNotificationsHandler from './userNotification';
import researchGroupActivityLogHandler from './researchGroupActivityLog';
import usersService from './../services/users';
import * as researchContentService from './../services/researchContent';

class AppEventHandler extends EventEmitter { }

const appEventHandler = new AppEventHandler();

appEventHandler.on(APP_EVENTS.PROPOSAL_ACCEPTED, async (source) => {
  const { tx, emitter } = source;
  const [op_name, op_payload] = tx['operations'][0];
  const tag = deipRpc.operations.getOperationTag(op_name);

  switch (tag) {
    case PROPOSAL_TYPE.CREATE_RESEARCH: {
      appEventHandler.emit(APP_EVENTS.RESEARCH_CREATED, source);
      break
    }
    case PROPOSAL_TYPE.CREATE_RESEARCH_MATERIAL: {
      appEventHandler.emit(APP_EVENTS.RESEARCH_MATERIAL_CREATED, source);
      break
    }
    default: {
      break;
    }
  }
});


appEventHandler.on(APP_EVENTS.RESEARCH_PROPOSED, async (source) => {
  const { tx, emitter } = source;
  const operation = tx['operations'][0][1]['proposed_ops'][0]['op'];
  const { research_group: researchGroupExternalId, title } = operation[1];

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const proposerUser = await usersService.findUserProfileByOwner(emitter);

  const payload = { researchGroup: chainResearchGroup, proposer: proposerUser, title };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_PROPOSED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_PROPOSED, payload);
});


appEventHandler.on(APP_EVENTS.RESEARCH_CREATED, async (source) => {
  const { tx, emitter } = source;
  const operation = tx['operations'][0];
  const { research_group: researchGroupExternalId, external_id: researchExternalId } = operation[1];

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const chainResearch = await deipRpc.api.getResearchAsync(researchExternalId);
  const creatorUser = await usersService.findUserProfileByOwner(emitter);
  const isAcceptedByQuorum = researchGroupExternalId != emitter;

  const payload = { researchGroup: chainResearchGroup, research: chainResearch, creator: creatorUser, isAcceptedByQuorum };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_CREATED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_CREATED, payload);
});


appEventHandler.on(APP_EVENTS.RESEARCH_MATERIAL_PROPOSED, async (source) => {
  const { tx, emitter } = source;
  const operation = tx['operations'][0][1]['proposed_ops'][0]['op'];
  const { research_group: researchGroupExternalId, research_external_id: researchExternalId, title } = operation[1];

  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupExternalId);
  const chainResearch = await deipRpc.api.getResearchAsync(researchExternalId);
  const proposerUser = await usersService.findUserProfileByOwner(emitter);

  const payload = { researchGroup: chainResearchGroup, research: chainResearch, proposer: proposerUser, title };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_MATERIAL_PROPOSED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_MATERIAL_PROPOSED, payload);
});


appEventHandler.on(APP_EVENTS.RESEARCH_MATERIAL_CREATED, async (source) => {
  const { tx, emitter } = source;
  const operation = tx['operations'][0];
  const { external_id: researchContentExternalId, research_external_id: researchExternalId } = operation[1];

  const chainResearchContent = await deipRpc.api.getResearchContentAsync(researchContentExternalId);
  const chainResearch = await deipRpc.api.getResearchAsync(researchExternalId);
  const chainResearchGroup = await deipRpc.api.getResearchGroupAsync(chainResearch.research_group.external_id);
  const creatorUser = await usersService.findUserProfileByOwner(emitter);
  const isAcceptedByQuorum = chainResearchGroup.external_id != emitter;

  const researchContent = await researchContentService.findResearchContentById(researchContentExternalId)

  const researchContentData = researchContent.toObject();
  const update = { status: RESEARCH_CONTENT_STATUS.PUBLISHED };

  const updatedResearchContent = await researchContentService.updateResearchContent(researchContentExternalId, {
    ...researchContentData,
    ...update
  });

  const payload = { researchGroup: chainResearchGroup, research: chainResearch, researchContent: chainResearchContent, creator: creatorUser, isAcceptedByQuorum };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_MATERIAL_CREATED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_MATERIAL_CREATED, payload);
});


export default appEventHandler;