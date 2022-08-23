import {
  APP_EVENT,
  AssetType,
  NftItemMetadataDraftStatus
} from '@casimir/platform-core';
import {
  AssetService,
  FTClassService,
  NFTCollectionMetadataService,
  NFTItemMetadataDraftService,
  NFTItemMetadataService,
} from '../../../services';
import { genSha256Hash } from '@casimir/toolbox';
import mongoose from 'mongoose';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';


class AssetEventHandler extends PortalAppEventHandler {

  constructor() {
    super();
  }

}

const assetEventHandler = new AssetEventHandler();
const assetService = new AssetService();
const ftClassService = new FTClassService();
const nftCollectionMetadataService = new NFTCollectionMetadataService();
const nftItemMetadataService = new NFTItemMetadataService();
const nftItemMetadataDraftService = new NFTItemMetadataDraftService();

assetEventHandler.register(APP_EVENT.FT_CREATED, async (event) => {

  const {
    entityId,
    issuer,
    symbol,
    precision,
    maxSupply,
    minBallance,
    description
  } = event.getEventPayload();

  const settings = {
    maxSupply,
    minBallance
  };

  await ftClassService.createFTClass({
    entityId,
    symbol,
    precision,
    issuer,
    description,
    type: AssetType.FT,
    metadata: settings
  });

  await assetService.createAsset({
    entityId,
    symbol,
    precision,
    issuer,
    description,
    type: AssetType.FT
  });
});

assetEventHandler.register(APP_EVENT.NFT_COLLECTION_METADATA_CREATED, async (event) => {
  const {
    entityId,
    issuer,
    attributes,
    issuedByTeam
  } = event.getEventPayload();

  await nftCollectionMetadataService.createNFTCollectionMetadata({
    _id: entityId,
    issuer,
    attributes,
    issuedByTeam
  });

});

assetEventHandler.register(APP_EVENT.NFT_COLLECTION_METADATA_UPDATED, async (event) => {
  const {
    _id,
    attributes
  } = event.getEventPayload();

  await nftCollectionMetadataService.updateNFTCollectionMetadata({
    _id,
    attributes
  });
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_CREATED, async (event) => {

  const {
    nftCollectionId,
    nftItemId,
    entityId,
    authors,
    owner,
    ownedByTeam,
    attributes,
    status
  } = event.getEventPayload();

  const _id = mongoose.Types.ObjectId(entityId);

  const draftData = {
    _id,
    nftCollectionId,
    nftItemId,
    hash: '',
    algo: 'sha256',
    owner,
    ownedByTeam,
    status: status || NftItemMetadataDraftStatus.IN_PROGRESS,
    authors: authors || [],
    attributes
  }

  draftData.hash = genSha256Hash(JSON.stringify(attributes));

  await nftItemMetadataDraftService.createNFTItemMetadataDraft(draftData);
  await nftCollectionMetadataService.increaseNftCollectionNextItemId(nftCollectionId);
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_UPDATED, async (event) => {

  const {
    _id: draftId,
    authors,
    status,
    attributes,
  } = event.getEventPayload();

  let packageHash = '';

  packageHash = genSha256Hash(JSON.stringify(attributes));

  await nftItemMetadataDraftService.updateNFTItemMetadataDraft({
    _id: draftId,
    authors,
    status,
    hash: packageHash,
    attributes,
  })
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_DELETED, async (event) => {
  const { _id } = event.getEventPayload();

  await nftItemMetadataDraftService.deleteNFTItemMetadataDraft(_id);
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_CREATED, async (event) => {
  const {
    nftCollectionId,
    owner,
    ownedByTeam,
    nftItemMetadataDraftId,
    authors,
    entityId,
    attributes
  } = event.getEventPayload();

  const draft = await nftItemMetadataDraftService.getNFTItemMetadataDraft(nftItemMetadataDraftId)

  await nftItemMetadataService.createNFTItemMetadata({
    ...draft,
    _id: { nftItemId: entityId, nftCollectionId: nftCollectionId },
    nftCollectionId,
    owner,
    ownedByTeam,
    authors,
    attributes,
  })

  await nftItemMetadataDraftService.deleteNFTItemMetadataDraft(draft._id);
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_MODERATION_MSG_UPDATED, async (event) => {
  const { _id, moderationMessage } = event.getEventPayload();

  await nftItemMetadataDraftService.updateNFTItemMetadataDraft({
    _id,
    moderationMessage
  })
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_STATUS_UPDATED, async (event) => {
  const { _id, status } = event.getEventPayload();

  await nftItemMetadataDraftService.updateNFTItemMetadataDraft({
    _id,
    status,
  })
});

module.exports = assetEventHandler;