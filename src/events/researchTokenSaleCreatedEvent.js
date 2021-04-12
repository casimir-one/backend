import assert from 'assert';
import { APP_EVENTS } from './../constants';
import AppEvent from './appEvent';

class ResearchTokenSaleCreatedEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = APP_EVENTS.RESEARCH_TOKEN_SALE_CREATED) {
    assert(onchainDatums.some(([opName]) => opName == 'create_research_token_sale'), "create_research_token_sale_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getSourceData() {
    let [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'create_research_token_sale');
    let { external_id: researchTokenSaleExternalId, research_external_id: researchExternalId, research_group: researchGroupExternalId } = opPayload;
    return { ...super.getSourceData(), researchTokenSaleExternalId, researchExternalId, researchGroupExternalId };
  }
}

module.exports = ResearchTokenSaleCreatedEvent;