import assert from 'assert';
import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';
import ProposalEvent from './proposalEvent';


class ResearchNdaProposedEvent extends ProposalEvent(AppEvent) {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_NDA_PROPOSED) {
    assert(onchainDatums.some(([opName]) => opName == 'create_research_nda'), "create_research_nda is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getSourceData() {
    const [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'create_research_nda');
    const { external_id: ndaExternalId, researches: [researchExternalId], parties } = opPayload;
    return { ...super.getSourceData(), ndaExternalId, researchExternalId, parties };
  }
}

module.exports = ResearchNdaProposedEvent;