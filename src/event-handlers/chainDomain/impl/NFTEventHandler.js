import { DOMAIN_EVENT } from '@casimir.one/platform-core';
import {
  ItemService, ProposalService, TeamService, UserService
} from '../../../services';
import { logWarn } from '../../../utils/log';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';

class NFTEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const nftEventHandler = new NFTEventHandler();


nftEventHandler.register(DOMAIN_EVENT.NFT_APPROVAL_CANCELED, async (event) => {
  console.log("NFT_APPROVAL_CANCELED", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_APPROVED_TRANSFER, async (event) => {
  console.log("NFT_APPROVED_TRANSFER", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_ASSET_STATUS_CHANGED, async (event) => {
  console.log("NFT_ASSET_STATUS_CHANGED", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_ATTRIBUTE_CLEARED, async (event) => {
  console.log("NFT_ATTRIBUTE_CLEARED", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_ATTRIBUTE_SET, async (event) => {
  console.log("NFT_ATTRIBUTE_SET", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_BURNED, async (event) => {
  console.log("NFT_BURNED", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_CLASS_FROZEN, async (event) => {
  console.log("NFT_CLASS_FROZEN", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_CLASS_METADATA_CLEARED, async (event) => {
  console.log("NFT_CLASS_METADATA_CLEARED", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_CLASS_METADATA_SET, async (event) => {
  console.log("NFT_CLASS_METADATA_SET", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_CLASS_THAWED, async (event) => {
  console.log("NFT_CLASS_THAWED", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_COLLECTION_CREATED, async (event) => {
  console.log("NFT_COLLECTION_CREATED", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_DESTROYED, async (event) => {
  console.log("NFT_DESTROYED", event.getEventPayload());
});

nftEventHandler.register(DOMAIN_EVENT.NFT_FORCE_CREATED, async (event) => {
  console.log("NFT_FORCE_CREATED", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_FROZEN, async (event) => {
  console.log("NFT_FROZEN", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_METADATA_CLEARED, async (event) => {
  console.log("NFT_METADATA_CLEARED", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_METADATA_SET, async (event) => {
  console.log("NFT_METADATA_SET", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_OWNER_CHANGED, async (event) => {
  console.log("NFT_OWNER_CHANGED", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_TEAM_CHANGED, async (event) => {
  console.log("NFT_TEAM_CHANGED", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_THAWED, async (event) => {
  console.log("NFT_THAWED", event.getEventPayload())
});


module.exports = nftEventHandler;