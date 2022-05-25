import { DOMAIN_EVENT } from '@deip/constants';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';


class NonFungibleTokenEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const nonFungibleTokenEventHandler = new NonFungibleTokenEventHandler();


nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_APPROVAL_CANCELED, async (event) => {
  console.log("NFT_APPROVAL_CANCELED", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_APPROVED_TRANSFER, async (event) => {
  console.log("NFT_APPROVED_TRANSFER", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_ASSET_STATUS_CHANGED, async (event) => {
  console.log("NFT_ASSET_STATUS_CHANGED", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_ATTRIBUTE_CLEARED, async (event) => {
  console.log("NFT_ATTRIBUTE_CLEARED", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_ATTRIBUTE_SET, async (event) => {
  console.log("NFT_ATTRIBUTE_SET", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_BURNED, async (event) => {
  console.log("NFT_BURNED", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_CLASS_FROZEN, async (event) => {
  console.log("NFT_CLASS_FROZEN", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_CLASS_METADATA_CLEARED, async (event) => {
  console.log("NFT_CLASS_METADATA_CLEARED", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_CLASS_METADATA_SET, async (event) => {
  console.log("NFT_CLASS_METADATA_SET", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_CLASS_THAWED, async (event) => {
  console.log("NFT_CLASS_THAWED", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_CREATED, async (event) => {
  console.log("NFT_CREATED", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_DESTROYED, async (event) => {
  console.log("NFT_DESTROYED", event.getEventPayload());
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_FORCE_CREATED, async (event) => {
  console.log("NFT_FORCE_CREATED", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_FROZEN, async (event) => {
  console.log("NFT_FROZEN", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_ISSUED, async (event) => {
  console.log("NFT_ISSUED", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_METADATA_CLEARED, async (event) => {
  console.log("NFT_METADATA_CLEARED", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_METADATA_SET, async (event) => {
  console.log("NFT_METADATA_SET", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_OWNER_CHANGED, async (event) => {
  console.log("NFT_OWNER_CHANGED", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_REDEPOSITED, async (event) => {
  console.log("NFT_REDEPOSITED", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_TEAM_CHANGED, async (event) => {
  console.log("NFT_TEAM_CHANGED", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_THAWED, async (event) => {
  console.log("NFT_THAWED", event.getEventPayload())
});

nonFungibleTokenEventHandler.register(DOMAIN_EVENT.NFT_TRANSFERRED, async (event) => {
  console.log("NFT_TRANSFERRED", event.getEventPayload())
});

module.exports = nonFungibleTokenEventHandler;
