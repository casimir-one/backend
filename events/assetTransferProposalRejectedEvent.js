import { APP_EVENTS } from './../constants';
import ProposalRejectedEvent from './proposalRejectedEvent';

class AssetTransferProposalRejectedEvent extends ProposalRejectedEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.ASSET_TRANSFER_PROPOSAL_REJECTED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = AssetTransferProposalRejectedEvent;