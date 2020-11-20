import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { APP_EVENTS, PROPOSAL_TYPE } from './../constants';
import { handle, fire, wait } from './utils';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';
import ProposalService from './../services/proposal';
import usersService from './../services/users';

class ResearchGroupHandler extends EventEmitter { }

const researchGroupHandler = new ResearchGroupHandler();


researchGroupHandler.on(APP_EVENTS.RESEARCH_GROUP_CREATED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupCreatedEvent, tenant } = source;

  const researchGroupsService = new ResearchGroupService();
  const { researchGroupExternalId, creator } = researchGroupCreatedEvent.getEventModel();

  await researchGroupsService.createResearchGroupRef({
    externalId: researchGroupExternalId,
    creator: creator
  });

  const researchGroup = await researchGroupsService.getResearchGroup(researchGroupExternalId);
  return researchGroup;
}));



export default researchGroupHandler;