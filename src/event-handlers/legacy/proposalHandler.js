import EventEmitter from 'events';
import deipRpc from '@deip/rpc-client';
import { APP_PROPOSAL } from '@deip/constants';
import { LEGACY_APP_EVENTS } from './../../constants';
import { handle, fire, wait } from './utils';
import ProposalService from './../../services/impl/write/ProposalService';
import { UserDtoService, TeamDtoService } from './../../services';
import config from './../../config';
import { ChainService } from '@deip/chain-service';


class ProposalHandler extends EventEmitter { }

const proposalHandler = new ProposalHandler();

const userDtoService = new UserDtoService({ scoped: false });
const teamDtoService = new TeamDtoService({ scoped: false });
const proposalService = new ProposalService({ scoped: false });

async function createProposal(event, chainContractType) {

  const proposalId = event.getProposalId();
  const eventModel = event.getSourceData();
  const chainService = await ChainService.getInstanceAsync(config);
  const chainApi = chainService.getChainApi();
  const chainProposal = await chainApi.getProposalStateAsync(proposalId);

  const chainAccounts = await chainApi.getAccountsAsync(chainProposal.required_approvals);

  const researchGroupsNames = chainAccounts.filter(a => a.is_research_group).map(a => a.name);
  const usersNames = chainAccounts.filter(a => !a.is_research_group).map(a => a.name);

  const involvedUsers = await userDtoService.getUsers(usersNames);
  const involvedResearchGroups = await teamDtoService.getTeams(researchGroupsNames);

  const multiTenantIds = [...involvedUsers, ...involvedResearchGroups].reduce((acc, item) => {
    if (!acc.some(id => id == item.tenantId)) {
      acc.push(item.tenantId);
    }
    return acc;
  }, []);
  
  const proposalRef = await proposalService.createProposal({
    status: chainProposal.status,
    proposalId: proposalId,
    type: chainContractType,
    details: {
      ...eventModel
    },
    multiTenantIds: multiTenantIds
  });

  return proposalRef;
}


proposalHandler.on(LEGACY_APP_EVENTS.ASSET_EXCHANGE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetExchangeProposedEvent } = source;
  const proposalRef = await createProposal(assetExchangeProposedEvent, APP_PROPOSAL.ASSET_EXCHANGE_PROPOSAL);
  return proposalRef;
}));

proposalHandler.on(LEGACY_APP_EVENTS.ASSET_TRANSFER_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: assetTransferProposedEvent } = source;
  const proposalRef = await createProposal(assetTransferProposedEvent, APP_PROPOSAL.ASSET_TRANSFER_PROPOSAL);
  return proposalRef;
}));

proposalHandler.on(LEGACY_APP_EVENTS.RESEARCH_GROUP_UPDATE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchGroupUpdateProposedEvent } = source;
  const proposalRef = await createProposal(researchGroupUpdateProposedEvent, APP_PROPOSAL.TEAM_UPDATE_PROPOSAL);
  return proposalRef;
}));

proposalHandler.on(LEGACY_APP_EVENTS.RESEARCH_CONTENT_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchContentProposedEvent } = source;
  const proposalRef = await createProposal(researchContentProposedEvent, APP_PROPOSAL.PROJECT_CONTENT_PROPOSAL);
  return proposalRef;
}));

proposalHandler.on(LEGACY_APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchTokenSaleProposedEvent } = source;
  const proposalRef = await createProposal(researchTokenSaleProposedEvent, APP_PROPOSAL.PROJECT_FUNDRASE_PROPOSAL);
  return proposalRef;
}));

proposalHandler.on(LEGACY_APP_EVENTS.RESEARCH_EXPRESS_LICENSE_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchExpressLicenseProposedEvent } = source;
  const proposalRef = await createProposal(researchExpressLicenseProposedEvent, APP_PROPOSAL.EXPRESS_LICENSE_PROPOSAL);
  return proposalRef;
}));

proposalHandler.on(LEGACY_APP_EVENTS.USER_RESIGNATION_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: userResignationProposedEvent } = source;
  const proposalRef = await createProposal(userResignationProposedEvent, APP_PROPOSAL.PROJECT_LEAVE_PROPOSAL);
  return proposalRef;
}));

proposalHandler.on(LEGACY_APP_EVENTS.RESEARCH_NDA_PROPOSED, (payload, reply) => handle(payload, reply, async (source) => {
  const { event: researchNdaProposedEvent } = source;
  const proposalRef = await createProposal(researchNdaProposedEvent, APP_PROPOSAL.PROJECT_NDA_PROPOSAL);
  return proposalRef;
}));

export default proposalHandler;