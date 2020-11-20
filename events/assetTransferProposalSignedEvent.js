import { APP_EVENTS } from './../constants';
import ProposalSignedEvent from './proposalSignedEvent';

class AssetTransferProposalSignedEvent extends ProposalSignedEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.ASSET_TRANSFER_PROPOSAL_SIGNED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = AssetTransferProposalSignedEvent;