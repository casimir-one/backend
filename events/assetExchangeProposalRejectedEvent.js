import { APP_EVENTS } from './../constants';
import ProposalRejectedEvent from './proposalRejectedEvent';

class AssetExchangeProposalRejectedEvent extends ProposalRejectedEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.ASSET_EXCHANGE_PROPOSAL_REJECTED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = AssetExchangeProposalRejectedEvent;