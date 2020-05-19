
import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { APP_EVENTS } from './../constants';
import userNotificationsHandler from './userNotification';
import researchGroupActivityLogHandler from './researchGroupActivityLog';
import usersService from './../services/users';

class AppEventHandler extends EventEmitter { }

const appEventHandler = new AppEventHandler();

appEventHandler.on(APP_EVENTS.RESEARCH_PROPOSED, async (source) => {
  const { tx, creator } = source;
  const operation = tx['operations'][0][1]['proposed_ops'][0]['op'];
  const { research_group: researchGroupAccount, external_id: researchExternalId, title } = operation[1];

  const researchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupAccount);
  const researchPromise = isProposalAutoAccepted ? deipRpc.api.getResearchAsync(researchExternalId) : Promise.resolve(null);
  const research = await researchPromise;
  const proposerUser = await usersService.findUserProfileByOwner(creator);
  const isProposalAutoAccepted = false;

  const payload = { researchGroup, research, proposer: proposerUser, title, isProposalAutoAccepted };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_PROPOSED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_PROPOSED, payload);
});

appEventHandler.on(APP_EVENTS.RESEARCH_CREATED, async (source) => {
  const { tx, creator } = source;
  const operation = tx['operations'][0];
  const { research_group: researchGroupAccount, external_id: researchExternalId } = operation[1];

  const researchGroup = await deipRpc.api.getResearchGroupAsync(researchGroupAccount);
  const research = await deipRpc.api.getResearchAsync(researchExternalId);
  const creatorUser = await usersService.findUserProfileByOwner(creator);

  const payload = { researchGroup, research, creator: creatorUser };

  userNotificationsHandler.emit(APP_EVENTS.RESEARCH_CREATED, payload);
  researchGroupActivityLogHandler.emit(APP_EVENTS.RESEARCH_CREATED, payload);
});


export default appEventHandler;