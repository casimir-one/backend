import { DOMAIN_EVENT } from '@deip/constants';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';


class ContractAgreementEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const contractAgreementEventHandler = new ContractAgreementEventHandler();

contractAgreementEventHandler.register(DOMAIN_EVENT.DEIP_CONTRACT_AGREEMENT_CREATED, async (event) => {
  console.log("CHAIN_DEIP_CONTRACT_AGREEMENT_CREATED", event.getEventPayload())
});

contractAgreementEventHandler.register(DOMAIN_EVENT.DEIP_CONTRACT_AGREEMENT_ACCEPTED, async (event) => {
  console.log("CHAIN_DEIP_CONTRACT_AGREEMENT_ACCEPTED", event.getEventPayload())
});

contractAgreementEventHandler.register(DOMAIN_EVENT.DEIP_CONTRACT_AGREEMENT_FINALIZED, async (event) => {
  console.log("CHAIN_DEIP_CONTRACT_AGREEMENT_FINALIZED", event.getEventPayload())
});

contractAgreementEventHandler.register(DOMAIN_EVENT.DEIP_CONTRACT_AGREEMENT_REJECTED, async (event) => {
  console.log("CHAIN_DEIP_CONTRACT_AGREEMENT_REJECTED", event.getEventPayload())
});


module.exports = contractAgreementEventHandler;
