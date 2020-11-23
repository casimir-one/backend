import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { APP_EVENTS, PROPOSAL_TYPE } from './../constants';
import { handle, fire, wait } from './utils';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';
import ProposalService from './../services/proposal';
import usersService from './../services/users';

class ProposalHandler extends EventEmitter { }

const proposalHandler = new ProposalHandler();


async function createProposalRef(event, chainContractType, tenant) {
  const researchGroupService = new ResearchGroupService();
  const researchService = new ResearchService(tenant);
  const proposalsService = new ProposalService(usersService, researchGroupService, researchService);

  const proposalId = event.getProposalId();
  const eventModel = event.getEventModel();

  const proposalRef = await proposalsService.createProposalRef(proposalId, {
    type: chainContractType,
    details: {
      ...eventModel
    }
  });

  return proposalRef;
}

proposalHandler.on(APP_EVENTS.RESEARCH_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchProposedEvent, tenant } = source;
  const proposalRef = await createProposalRef(researchProposedEvent, PROPOSAL_TYPE.CREATE_RESEARCH, tenant);
  return proposalRef;
}));


proposalHandler.on(APP_EVENTS.RESEARCH_UPDATE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchUpdateProposedEvent, tenant } = source;
  const proposalRef = await createProposalRef(researchUpdateProposedEvent, PROPOSAL_TYPE.UPDATE_RESEARCH, tenant);
  return proposalRef;
}));


proposalHandler.on(APP_EVENTS.ASSET_EXCHANGE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetExchangeProposedEvent, tenant } = source;
  const proposalRef = await createProposalRef(assetExchangeProposedEvent, PROPOSAL_TYPE.ASSET_EXCHANGE, tenant);
  return proposalRef;
}));


proposalHandler.on(APP_EVENTS.ASSET_TRANSFER_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetTransferProposedEvent, tenant } = source;
  const proposalRef = await createProposalRef(assetTransferProposedEvent, PROPOSAL_TYPE.ASSET_TRANSFER, tenant);
  return proposalRef;
}));

proposalHandler.on(APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdateProposedEvent, tenant } = source;
  const proposalRef = await createProposalRef(researchGroupUpdateProposedEvent, PROPOSAL_TYPE.UPDATE_RESEARCH_GROUP, tenant);
  return proposalRef;
}));

proposalHandler.on(APP_EVENTS.RESEARCH_CONTENT_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentProposedEvent, tenant } = source;
  const proposalRef = await createProposalRef(researchContentProposedEvent, PROPOSAL_TYPE.CREATE_RESEARCH_MATERIAL, tenant);
  return proposalRef;
}));

proposalHandler.on(APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchTokenSaleProposedEvent, tenant } = source;
  const proposalRef = await createProposalRef(researchTokenSaleProposedEvent, PROPOSAL_TYPE.CREATE_RESEARCH_TOKEN_SALE, tenant);
  return proposalRef;
}));


export default proposalHandler;