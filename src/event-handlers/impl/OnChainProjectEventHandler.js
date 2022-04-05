import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';


class OnChainProjectEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }
}

const onChainProjectEventHandler = new OnChainProjectEventHandler();


onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_CREATED, async (event) => {
  console.log("CHAIN_PROJECT_CREATED", event.getEventPayload());
});

onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_UPDATED, async (event) => {
  console.log("CHAIN_PROJECT_UPDATED", event.getEventPayload());
});

onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_REMOVED, async (event) => {
  console.log("CHAIN_PROJECT_REMOVED", event.getEventPayload());
});

onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_CONTENT_CREATED, async (event) => {
  console.log("CHAIN_PROJECT_CONTENT_CREATED", event.getEventPayload());
});

onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_NDA_CREATED, async (event) => {
  console.log("CHAIN_PROJECT_NDA_CREATED", event.getEventPayload());
});

onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_NDA_ACCESS_REQUEST_CREATED, async (event) => {
  console.log("CHAIN_PROJECT_NDA_ACCESS_REQUEST_CREATED", event.getEventPayload());
});

onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_NDA_ACCESS_REQUEST_FULFILLED, async (event) => {
  console.log("CHAIN_PROJECT_NDA_ACCESS_REQUEST_FULFILLED", event.getEventPayload());
});

onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_NDA_ACCESS_REQUEST_REJECTED, async (event) => {
  console.log("CHAIN_PROJECT_NDA_ACCESS_REQUEST_REJECTED", event.getEventPayload());
});

onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_DOMAIN_ADDED, async (event) => {
  console.log("CHAIN_PROJECT_DOMAIN_ADDED", event.getEventPayload());
});

onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_REVIEW_CREATED, async (event) => {
  console.log("CHAIN_PROJECT_REVIEW_CREATED", event.getEventPayload());
});

onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_REVIEW_UPVOTED, async (event) => {
  console.log("CHAIN_PROJECT_REVIEW_UPVOTED", event.getEventPayload());
});

onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_TOKEN_SALE_CREATED, async (event) => {
  console.log("CHAIN_PROJECT_TOKEN_SALE_CREATED", event.getEventPayload());
});

onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_TOKEN_SALE_ACTIVATED, async (event) => {
  console.log("CHAIN_PROJECT_TOKEN_SALE_ACTIVATED", event.getEventPayload());
});

onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_TOKEN_SALE_FINISHED, async (event) => {
  console.log("CHAIN_PROJECT_TOKEN_SALE_FINISHED", event.getEventPayload());
});

onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_TOKEN_SALE_EXPIRED, async (event) => {
  console.log("CHAIN_PROJECT_TOKEN_SALE_EXPIRED", event.getEventPayload());
});

onChainProjectEventHandler.register(APP_EVENT.CHAIN_PROJECT_TOKEN_SALE_CONTRIBUTED, async (event) => {
  console.log("CHAIN_PROJECT_TOKEN_SALE_CONTRIBUTED", event.getEventPayload());
});

module.exports = onChainProjectEventHandler;
