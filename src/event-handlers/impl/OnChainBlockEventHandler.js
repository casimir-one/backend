import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';


class OnChainBlockEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }
}

const onChainEventHandler = new OnChainBlockEventHandler();

onChainEventHandler.register(APP_EVENT.CHAIN_BLOCK_CREATED, async (event) => {
  // console.log("CHAIN_BLOCK_CREATED", event.getEventPayload())
});

module.exports = onChainEventHandler;
