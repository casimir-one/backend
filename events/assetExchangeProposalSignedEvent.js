import { APP_EVENTS } from './../constants';
import ProposalSignedEvent from './proposalSignedEvent';

class AssetExchangeProposalSignedEvent extends ProposalSignedEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.ASSET_EXCHANGE_PROPOSAL_SIGNED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = AssetExchangeProposalSignedEvent;