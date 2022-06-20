import { ChainService } from '@deip/chain-service';
import { APP_EVENT } from '@deip/constants';
import config from '../../../config';
import APP_PROPOSAL_EVENT from '../../../events/base/AppProposalEvent';
import {
  ProposalService,
  TeamDtoService,
  NFTItemMetadataDraftService
} from '../../../services';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';

class ProposalEventHandler extends PortalAppEventHandler {

  constructor() {
    super();
  }

}

const proposalEventHandler = new ProposalEventHandler();

const proposalService = new ProposalService();
const teamDtoService = new TeamDtoService();
const nftItemMetadataDraftService = new NFTItemMetadataDraftService();


proposalEventHandler.register(APP_EVENT.PROPOSAL_CREATED, async (event) => {
  const { proposalId, creator, status, proposalCmd, type } = event.getEventPayload();
  const chainService = await ChainService.getInstanceAsync(config);
  const chainRpc = chainService.getChainRpc();
  const chainProposal = await chainRpc.getProposalAsync(proposalId);
  const portalIdsScope = [];
  const decisionMakers = [];

  if (chainProposal) { // Proposal may be deleted from the chain once it's resolved, let's keep this check until subscriptions to chain Event Stream
    const teams = await teamDtoService.getTeams(chainProposal.decisionMakers);
    const portalIdsScope = teams.reduce((acc, item) => {
      return acc.some(id => id == item.portalId) ? acc : [...acc, item.portalId];
    }, []);
    portalIdsScope.push(...portalIdsScope);
    decisionMakers.push(...chainProposal.decisionMakers);
  } else {
    console.warn(`Proposal with ID '${proposalId}' is not found in the Chain`);
  }


  let details = {}; // TEMP support for legacy 'details' field, must be removed after schema separation
  const ProposalCreatedHookEvent = APP_PROPOSAL_EVENT[type]['CREATED'];
  if (ProposalCreatedHookEvent) {
    const proposedCmds = proposalCmd.getProposedCmds();
    const typedEvent = new ProposalCreatedHookEvent({
      proposalCmd: proposalCmd,
      proposalCtx: { proposalId, type, proposedCmds }
    });
    details = typedEvent.getEventPayload();
  }
  await proposalService.createProposal({
    proposalId: proposalId,
    proposalCmd: proposalCmd,
    status: status,
    type: type,
    details: details,
    portalIdsScope: portalIdsScope,
    creator: creator,
    decisionMakers: decisionMakers
  });

});

proposalEventHandler.register(APP_EVENT.PROPOSAL_ACCEPTED, async (event) => {
  const { proposalId, status, account } = event.getEventPayload();

  const proposal = await proposalService.getProposal(proposalId);

  const approvers = [...proposal.approvers, account];
  await proposalService.updateProposal(proposalId, {
    status: status,
    approvers: approvers
  });
});

proposalEventHandler.register(APP_EVENT.PROPOSAL_DECLINED, async (event) => {
  const { proposalId, status, account } = event.getEventPayload();

  const proposal = await proposalService.getProposal(proposalId);
  const rejectors = [...proposal.rejectors, account];
  await proposalService.updateProposal(proposalId, {
    status: status,
    rejectors: rejectors
  });
});

proposalEventHandler.register(APP_EVENT.TEAM_UPDATE_PROPOSAL_ACCEPTED, async (event) => {
  // TODO: create multisig transaction read schema
});

proposalEventHandler.register(APP_EVENT.TEAM_UPDATE_PROPOSAL_CREATED, async (event) => {
  // TODO: create multisig transaction read schema
});

proposalEventHandler.register(APP_EVENT.TEAM_UPDATE_PROPOSAL_DECLINED, async (event) => {
  // TODO: create multisig transaction read schema
});

proposalEventHandler.register(APP_EVENT.PROJECT_TOKEN_SALE_PROPOSAL_CREATED, async (event) => {
  // TODO: create multisig transaction read schema
});

proposalEventHandler.register(APP_EVENT.PROJECT_TOKEN_SALE_PROPOSAL_ACCEPTED, async (event) => {
  // TODO: create multisig transaction read schema
});

proposalEventHandler.register(APP_EVENT.PROJECT_TOKEN_SALE_PROPOSAL_DECLINED, async (event) => {
  // TODO: create multisig transaction read schema
});

proposalEventHandler.register(APP_EVENT.NFT_LAZY_SELL_PROPOSAL_CREATED, async (event) => {
  const { proposalId, nftCollectionId, nftItemId, } = event.getEventPayload();

  const draft = await nftItemMetadataDraftService.findOne({ nftCollectionId, nftItemId });

  await nftItemMetadataDraftService.updateOne({ _id: draft._id }, { lazySellProposalId: proposalId });
});


proposalEventHandler.register(APP_EVENT.NFT_LAZY_SELL_PROPOSAL_ACCEPTED, async (event) => { });
proposalEventHandler.register(APP_EVENT.NFT_LAZY_SELL_PROPOSAL_DECLINED, async (event) => { });
proposalEventHandler.register(APP_EVENT.NFT_LAZY_BUY_PROPOSAL_CREATED, async (event) => { });
proposalEventHandler.register(APP_EVENT.NFT_LAZY_SELL_PROPOSAL_DECLINED, async (event) => { });



module.exports = proposalEventHandler;