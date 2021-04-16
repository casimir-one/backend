import { APP_EVENTS } from './../../constants';
import AppEvent from './appEvent';
import ProposalSignedEvent from './proposalSignedEvent';

class AssetExchangeProposalSignedEvent extends ProposalSignedEvent(AppEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.ASSET_EXCHANGE_PROPOSAL_SIGNED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = AssetExchangeProposalSignedEvent;