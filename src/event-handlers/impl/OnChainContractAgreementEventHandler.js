import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';


class OnChainContractAgreementEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }
}

const onChainContractAgreementEventHandler = new OnChainContractAgreementEventHandler();

onChainContractAgreementEventHandler.register(APP_EVENT.CHAIN_DEIP_CONTRACT_AGREEMENT_CREATED, async (event) => {
  console.log("CHAIN_DEIP_CONTRACT_AGREEMENT_CREATED", event.getEventPayload())
});

onChainContractAgreementEventHandler.register(APP_EVENT.CHAIN_DEIP_CONTRACT_AGREEMENT_ACCEPTED, async (event) => {
  console.log("CHAIN_DEIP_CONTRACT_AGREEMENT_ACCEPTED", event.getEventPayload())
});

onChainContractAgreementEventHandler.register(APP_EVENT.CHAIN_DEIP_CONTRACT_AGREEMENT_FINALIZED, async (event) => {
  console.log("CHAIN_DEIP_CONTRACT_AGREEMENT_FINALIZED", event.getEventPayload())
});

onChainContractAgreementEventHandler.register(APP_EVENT.CHAIN_DEIP_CONTRACT_AGREEMENT_REJECTED, async (event) => {
  console.log("CHAIN_DEIP_CONTRACT_AGREEMENT_REJECTED", event.getEventPayload())
});


module.exports = onChainContractAgreementEventHandler;
