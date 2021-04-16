import assert from 'assert';
import { LEGACY_APP_EVENTS } from './../../constants';
import AppEvent from './appEvent';

class ResearchTokenSaleContributedEvent extends AppEvent {
  constructor(onchainDatums, offchainMeta, eventName = LEGACY_APP_EVENTS.RESEARCH_TOKEN_SALE_CONTRIBUTED) {
    assert(onchainDatums.some(([opName]) => opName == 'contribute_to_token_sale'), "contribute_to_token_sale_operation is not provided");
    super(onchainDatums, offchainMeta, eventName);
  }

  getSourceData() {
    let [opName, opPayload] = this.onchainDatums.find(([opName]) => opName == 'contribute_to_token_sale');
    let { token_sale_external_id: tokenSaleExternalId } = opPayload;
    return { ...super.getSourceData(), tokenSaleExternalId };
  }
}

module.exports = ResearchTokenSaleContributedEvent;