import { DOMAIN_EVENT } from '@deip/constants';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';


class NativeFTEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const nativeFTEventHandler = new NativeFTEventHandler();

nativeFTEventHandler.register(DOMAIN_EVENT.NATIVE_FT_TRANSFER, async (event) => {
  console.log("NATIVE_FT_TRANSFER", event.getEventPayload())
});


module.exports = nativeFTEventHandler;
