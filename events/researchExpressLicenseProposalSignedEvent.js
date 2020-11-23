import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';
import ProposalSignedEvent from './proposalSignedEvent';

class ResearchExpressLicenseProposalSignedEvent extends ProposalSignedEvent(AppEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_EXPRESS_LICENSE_PROPOSAL_SIGNED) {
    super(onchainDatums, offchainMeta, eventName);
  }
}

module.exports = ResearchExpressLicenseProposalSignedEvent;