import { DOMAIN_EVENT } from '@deip/constants';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';


class BlockEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const blockEventHandler = new BlockEventHandler();

blockEventHandler.register(DOMAIN_EVENT.BLOCK_CREATED, async (event) => {
  console.log("CHAIN_BLOCK_CREATED", event.getEventPayload())
});

module.exports = blockEventHandler;
