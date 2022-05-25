import { DOMAIN_EVENT } from '@deip/constants';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';


class NativeFungibleTokenEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const nativeFungibleTokenEventHandler = new NativeFungibleTokenEventHandler();

nativeFungibleTokenEventHandler.register(DOMAIN_EVENT.NATIVE_FT_TRANSFER, async (event) => {
  console.log("NATIVE_FT_TRANSFER", event.getEventPayload())
});


module.exports = nativeFungibleTokenEventHandler;
