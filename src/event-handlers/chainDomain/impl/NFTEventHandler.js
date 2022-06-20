import { DOMAIN_EVENT } from '@deip/constants';
import {
  NFTItemMetadataDraftService,
  NFTItemMetadataService, ProposalService, TeamService, UserService
} from '../../../services';
import { logWarn } from '../../../utils/log';
import ChainDomainEventHandler from '../../base/ChainDomainEventHandler';

class NFTEventHandler extends ChainDomainEventHandler {

  constructor() {
    super();
  }
}

const nftEventHandler = new NFTEventHandler();
const nftItemMetadataDraftService = new NFTItemMetadataDraftService();
const nftItemMetadataService = new NFTItemMetadataService();
const proposalService = new ProposalService();
const userService = new UserService();
const teamService = new TeamService();


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

nftEventHandler.register(DOMAIN_EVENT.NFT_ITEM_CREATED, async (event) => {
  const { class: nftCollectionId, instance: nftItemId, owner: ownerAddress } = event.getEventPayload();

  const draft = await nftItemMetadataDraftService.findOne({ nftItemId: String(nftItemId), nftCollectionId: String(nftCollectionId) });
  if (!draft) {
    logWarn("Chain eventHandler, nft item already created");
  }
  let ownerDao;
  ownerDao = await userService.findOne({ address: ownerAddress });
  if (!ownerDao) {
    ownerDao = await teamService.findOne({ address: ownerAddress });
  }
  const nftItem = await nftItemMetadataService.createNFTItemMetadata({
    ...draft,
    _id: { nftItemId: String(nftItemId), nftCollectionId: String(nftCollectionId) },
    nftCollectionId,
    owner: ownerDao?._id || null,
    ownedByTeam: !!ownerDao?.members,
    ownerAddress,
    metadata: {
      ...draft.metadata,
    }
  });

  await nftItemMetadataDraftService.deleteNFTItemMetadataDraft(draft._id);
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

nftEventHandler.register(DOMAIN_EVENT.NFT_REDEPOSITED, async (event) => {
  console.log("NFT_REDEPOSITED", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_TEAM_CHANGED, async (event) => {
  console.log("NFT_TEAM_CHANGED", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_THAWED, async (event) => {
  console.log("NFT_THAWED", event.getEventPayload())
});

nftEventHandler.register(DOMAIN_EVENT.NFT_TRANSFERRED, async (event) => {
  const {
    class: nftCollectionId,
    instance: nftItemId,
    from: fromAddress,
    to: toAddress
  } = event.getEventPayload();

  const nftItem = await nftItemMetadataService.getNFTItemMetadata({ nftItemId, nftCollectionId });
  if (!nftItem) {
    logWarn("Chain eventHandler, nft item does not exist");
    return;
  }

  let newOwnerDao;
  newOwnerDao = await userService.findOne({ address: toAddress });
  if (!newOwnerDao) {
    newOwnerDao = await teamService.findOne({ address: toAddress });
  }

  await nftItemMetadataService.updateNFTItemMetadata({
    nftItemId,
    nftCollectionId,
    owner: newOwnerDao?._id || null,
    ownerAddress: toAddress,
    ownedByTeam: !!ownerDao?.members,
  });

});

module.exports = nftEventHandler
