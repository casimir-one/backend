import {
  APP_EVENT,
  ASSET_TYPE,
  NFT_ITEM_METADATA_DRAFT_STATUS,
  NFT_ITEM_METADATA_FORMAT
} from '@deip/constants';
import {
  AssetService,
  FTClassService,
  NFTCollectionMetadataService,
  NFTItemMetadataDraftService,
  NFTItemMetadataService,
} from '../../../services';
import { genSha256Hash } from '@deip/toolbox';
import mongoose from 'mongoose';
import path from 'path';
import FileStorage from '../../../storage';
import PortalAppEventHandler from '../../base/PortalAppEventHandler';

const options = { algo: 'sha256', encoding: 'hex', files: { ignoreRootName: true, ignoreBasename: true }, folder: { ignoreRootName: true } };


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
    type: ASSET_TYPE.FT,
    metadata: settings
  });

  await assetService.createAsset({
    entityId,
    symbol,
    precision,
    issuer,
    description,
    type: ASSET_TYPE.FT
  });
});

assetEventHandler.register(APP_EVENT.NFT_COLLECTION_METADATA_CREATED, async (event) => {
  const {
    entityId,
    issuer,
    attributes,
    isDefault,
    issuedByTeam
  } = event.getEventPayload();

  await nftCollectionMetadataService.createNFTCollectionMetadata({
    _id: entityId,
    issuer,
    attributes,
    isDefault,
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
    formatType,
    authors,
    owner,
    ownedByTeam,
    references,
    title,
    jsonData,
    metadata,
    attributes,
    status
  } = event.getEventPayload();

  const _id = mongoose.Types.ObjectId(entityId);

  const draftData = {
    _id,
    title: title || _id,
    nftCollectionId,
    nftItemId,
    hash: '',
    algo: 'sha256',
    formatType,
    owner,
    ownedByTeam,
    folder: _id,
    status: status || NFT_ITEM_METADATA_DRAFT_STATUS.IN_PROGRESS,
    authors: authors || [],
    references: references || [],
    packageFiles: [],
    foreignReferences: [],
    metadata,
    attributes
  }

  if (formatType === NFT_ITEM_METADATA_FORMAT.JSON) {
    const packageHash = genSha256Hash(JSON.stringify(jsonData));
    draftData.jsonData = jsonData;
    draftData.hash = packageHash;
    draftData.packageFiles = [];
  } else {
    const nftItemMetadataPackageDirPath = FileStorage.getNFTItemMetadataPackageDirPath(nftCollectionId, _id);
    const hashObj = await FileStorage.calculateDirHash(nftItemMetadataPackageDirPath, options);
    const hashes = hashObj.children.map(f => f.hash);
    hashes.sort();
    const packageHash = genSha256Hash(hashes.join(","));
    draftData.hash = packageHash;
    draftData.packageFiles = hashObj.children.map((f) => ({ filename: f.name, hash: f.hash, ext: path.extname(f.name) }));
  }

  await nftItemMetadataDraftService.createNFTItemMetadataDraft(draftData);
  await nftCollectionMetadataService.increaseNftCollectionNextItemId(nftCollectionId);
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_UPDATED, async (event) => {

  const {
    _id: draftId,
    authors,
    title,
    formatType,
    references,
    status,
    jsonData,
    metadata,
    attributes,
  } = event.getEventPayload();

  const draft = await nftItemMetadataDraftService.getNFTItemMetadataDraft(draftId);
  let packageHash = '';
  let packageFiles = [];
  if (formatType === NFT_ITEM_METADATA_FORMAT.JSON) {
    packageHash = genSha256Hash(JSON.stringify(jsonData));
  } else if (draft.formatType === NFT_ITEM_METADATA_FORMAT.PACKAGE) {
    const nftItemMetadataPackageDirPath = FileStorage.getNFTCollectionArchiveDirPath(draft.nftCollectionId, draftId);
    const hashObj = await FileStorage.calculateDirHash(nftItemMetadataPackageDirPath, options);
    const hashes = hashObj.children.map(f => f.hash);
    hashes.sort();
    packageHash = genSha256Hash(hashes.join(","));
    packageFiles = hashObj.children.map((f) => ({ filename: f.name, hash: f.hash, ext: path.extname(f.name) }));
  }

  await nftItemMetadataDraftService.updateNFTItemMetadataDraft({
    _id: draftId,
    authors,
    title,
    references,
    status,
    jsonData,
    metadata,
    hash: packageHash,
    packageFiles,
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
    references,
    title,
    entityId,
    metadata,
    attributes
  } = event.getEventPayload();

  const draft = await nftItemMetadataDraftService.getNFTItemMetadataDraft(nftItemMetadataDraftId)

  await nftItemMetadataService.createNFTItemMetadata({
    ...draft,
    _id: { nftItemId: entityId, nftCollectionId: nftCollectionId },
    nftCollectionId,
    owner,
    ownedByTeam,
    title,
    authors,
    references,
    attributes,
    metadata: {
      ...draft.metadata,
      ...metadata
    }
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