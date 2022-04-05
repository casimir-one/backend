import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';


class OnChainAssetEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }
}

const onChainAssetEventHandler = new OnChainAssetEventHandler();

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_CLASS_CREATED, async (event) => {
  console.log("CHAIN_ASSET_CLASS_CREATED", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_ISSUED, async (event) => {
  console.log("CHAIN_ASSET_ISSUED", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_TRANSFERRED, async (event) => {
  console.log("CHAIN_ASSET_TRANSFERRED", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_BURNED, async (event) => {
  console.log("CHAIN_ASSET_BURNED", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_TEAM_CHANGED, async (event) => {
  console.log("CHAIN_ASSET_TEAM_CHANGED", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_OWNER_CHANGED, async (event) => {
  console.log("CHAIN_ASSET_OWNER_CHANGED", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_ACCOUNT_FROZEN, async (event) => {
  console.log("CHAIN_ASSET_ACCOUNT_FROZEN", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_ACCOUNT_THAWED, async (event) => {
  console.log("CHAIN_ASSET_CLASS_CREATED", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_FROZEN, async (event) => {
  console.log("CHAIN_ASSET_CLASS_CREATED", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_CLASS_DESTROYED, async (event) => {
  console.log("CHAIN_ASSET_CLASS_DESTROYED", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_CLASS_FORCE_CREATED, async (event) => {
  console.log("CHAIN_ASSET_CLASS_FORCE_CREATED", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_METADATA_SET, async (event) => {
  console.log("CHAIN_ASSET_METADATA_SET", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_OCTOPUS, async (event) => {
  console.log("CHAIN_OCTOPUS", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_METADATA_CLEARED, async (event) => {
  console.log("CHAIN_ASSET_METADATA_CLEARED", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_APPROVED_TRANSFER, async (event) => {
  console.log("CHAIN_ASSET_APPROVED_TRANSFER", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_APPROVAL_CANCELLED, async (event) => {
  console.log("CHAIN_ASSET_APPROVAL_CANCELLED", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_TRANSFERRED_APPROVED, async (event) => {
  console.log("CHAIN_ASSET_TRANSFERRED_APPROVED", event.getEventPayload())
});

onChainAssetEventHandler.register(APP_EVENT.CHAIN_ASSET_STATUS_CHANGED, async (event) => {
  console.log("CHAIN_ASSET_STATUS_CHANGED", event.getEventPayload())
});

module.exports = onChainAssetEventHandler;
