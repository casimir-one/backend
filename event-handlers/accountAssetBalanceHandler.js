import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { APP_EVENTS, PROPOSAL_TYPE } from './../constants';
import { handle, fire, wait } from './utils';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';
import ProposalService from './../services/proposal';
import usersService from './../services/users';

class AccountAssetBalanceHandler extends EventEmitter { }

const accountAssetBalanceHandler = new AccountAssetBalanceHandler();

accountAssetBalanceHandler.on(APP_EVENTS.ASSET_EXCHANGE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetExchangeProposedEvent, tenant } = source;
  const researchGroupService = new ResearchGroupService();
  const researchService = new ResearchService(tenant);
  const proposalsService = new ProposalService(usersService, researchGroupService, researchService);

  const proposalId = assetExchangeProposedEvent.getProposalId();
  const eventModel = assetExchangeProposedEvent.getEventModel();

  const proposalRef = await proposalsService.createProposalRef(proposalId, {
    type: PROPOSAL_TYPE.ASSET_EXCHANGE,
    details: {
      ...eventModel
    }
  });

  return proposalRef;

}));


accountAssetBalanceHandler.on(APP_EVENTS.ASSET_TRANSFER_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetTransferProposedEvent, tenant } = source;
  const researchGroupService = new ResearchGroupService();
  const researchService = new ResearchService(tenant);
  const proposalsService = new ProposalService(usersService, researchGroupService, researchService);

  const proposalId = assetTransferProposedEvent.getProposalId();
  const eventModel = assetTransferProposedEvent.getEventModel();

  const proposalRef = await proposalsService.createProposalRef(proposalId, {
    type: PROPOSAL_TYPE.ASSET_TRANSFER,
    details: {
      ...eventModel
    }
  });

  return proposalRef;

}));






export default accountAssetBalanceHandler;