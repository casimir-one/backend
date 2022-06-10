import {
  APP_EVENT,
  ASSET_TYPE,
  PROJECT_CONTENT_DRAFT_STATUS,
  PROJECT_CONTENT_FORMAT,
  PROJECT_CONTENT_TYPES
} from '@deip/constants';
import {
  AssetService,
  FungibleTokenService,
  NftCollectionMetadataService,
  NftItemMetadataDraftService,
  NftItemMetadataService,
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
const fungibleTokenService = new FungibleTokenService();
const nftCollectionMetadataService = new NftCollectionMetadataService();
const nftItemMetadataService = new NftItemMetadataService();
const nftItemMetadataDraftService = new NftItemMetadataDraftService();

assetEventHandler.register(APP_EVENT.FT_CREATED, async (event) => {

  const {
    entityId,
    issuer,
    symbol,
    precision,
    maxSupply,
    minBallance,
    description,
    metadata
  } = event.getEventPayload();

  const settings = {
    projectId: undefined,
    licenseRevenueHoldersShare: undefined,
    maxSupply,
    minBallance
  };

  if (metadata) { // keep this until we have working F-NFT
    const { projectId, licenseRevenue } = metadata;
    settings.projectId = projectId;
    settings.licenseRevenueHoldersShare = licenseRevenue ? licenseRevenue.holdersShare : undefined;
  }

  await fungibleTokenService.createFungibleToken({
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
    nftCollectionId,
    issuer,
    attributes,
    isDefault,
    issuedByTeam
  } = event.getEventPayload();

  await nftCollectionMetadataService.createNftCollectionMetadata({
    _id: nftCollectionId,
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

  await nftCollectionMetadataService.updateNftCollectionMetadata({
    _id,
    attributes
  });
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_CREATED, async (event) => {

  const {
    nftCollectionId,
    entityId,
    contentType = PROJECT_CONTENT_TYPES.ANNOUNCEMENT,
    formatType,
    authors,
    owner,
    ownedByTeam,
    references,
    title,
    jsonData,
    metadata,
    attributes
  } = event.getEventPayload();

  const _id = mongoose.Types.ObjectId(entityId);

  const draftData = {
    _id,
    title: title || _id,
    nftCollectionId,
    hash: '',
    algo: 'sha256',
    contentType,
    formatType,
    owner,
    ownedByTeam,
    folder: _id,
    status: PROJECT_CONTENT_DRAFT_STATUS.IN_PROGRESS,
    authors: authors || [],
    references: references || [],
    packageFiles: [],
    foreignReferences: [],
    metadata,
    attributes
  }

  if (formatType === PROJECT_CONTENT_FORMAT.JSON) {
    const packageHash = genSha256Hash(JSON.stringify(jsonData));
    draftData.jsonData = jsonData;
    draftData.hash = packageHash;
    draftData.packageFiles = [];
  } else {
    const projectContentPackageDirPath = FileStorage.getProjectContentPackageDirPath(nftCollectionId, _id);
    const hashObj = await FileStorage.calculateDirHash(projectContentPackageDirPath, options);
    const hashes = hashObj.children.map(f => f.hash);
    hashes.sort();
    const packageHash = genSha256Hash(hashes.join(","));
    draftData.hash = packageHash;
    draftData.packageFiles = hashObj.children.map((f) => ({ filename: f.name, hash: f.hash, ext: path.extname(f.name) }));
  }

  const projectContentRef = await nftItemMetadataDraftService.createNftItemMetadataDraft(draftData);
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_UPDATED, async (event) => {

  const {
    _id: draftId,
    authors,
    title,
    contentType = PROJECT_CONTENT_TYPES.ANNOUNCEMENT,
    formatType,
    references,
    status,
    jsonData,
    metadata,
    attributes,
    xmlDraft
  } = event.getEventPayload();

  const draft = await nftItemMetadataDraftService.getNftItemMetadataDraft(draftId);
  let packageHash = '';
  let packageFiles = [];
  if (formatType === PROJECT_CONTENT_FORMAT.JSON) {
    packageHash = genSha256Hash(JSON.stringify(jsonData));
  } else if (draft.formatType === PROJECT_CONTENT_FORMAT.DAR || draft.formatType === PROJECT_CONTENT_FORMAT.PACKAGE) {
    const projectContentPackageDirPath = FileStorage.getProjectDarArchiveDirPath(draft.projectId, draftId);
    const hashObj = await FileStorage.calculateDirHash(projectContentPackageDirPath, options);
    const hashes = hashObj.children.map(f => f.hash);
    hashes.sort();
    packageHash = genSha256Hash(hashes.join(","));
    packageFiles = hashObj.children.map((f) => ({ filename: f.name, hash: f.hash, ext: path.extname(f.name) }));
  }

  await nftItemMetadataDraftService.updateNftItemMetadataDraft({
    _id: draftId,
    authors,
    title,
    contentType,
    references,
    status,
    jsonData,
    metadata,
    hash: packageHash,
    packageFiles,
    attributes
  })
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_DELETED, async (event) => {
  const { _id } = event.getEventPayload();

  await nftItemMetadataDraftService.deleteNftItemMetadataDraft(_id);
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_CREATED, async (event) => {

  const {
    nftCollectionId,
    owner,
    ownedByTeam,
    contentType = PROJECT_CONTENT_TYPES.ANNOUNCEMENT,
    nftItemMetadataDraftId,
    authors,
    references,
    title,
    entityId,
    metadata,
    attributes
  } = event.getEventPayload();

  const draft = await nftItemMetadataDraftService.getNftItemMetadataDraft(nftItemMetadataDraftId)

  const projectContent = await nftItemMetadataService.createNftItemMetadata({
    ...draft,
    _id: { nftItemId: entityId, nftCollectionId: nftCollectionId },
    nftCollectionId,
    owner,
    ownedByTeam,
    title,
    contentType,
    authors,
    references,
    attributes,
    metadata: {
      ...draft.metadata,
      ...metadata
    }
  })

  await nftItemMetadataDraftService.deleteNftItemMetadataDraft(draft._id);
});

assetEventHandler.register(APP_EVENT.PROJECT_CONTENT_STATUS_UPDATED, async (event) => {
  const {
    _id,
    status
  } = event.getEventPayload();

  await nftItemMetadataService.updateNftItemMetadata(_id, { status });
});

assetEventHandler.register(APP_EVENT.NFT_ITEM_METADATA_DRAFT_MODERATION_MSG_UPDATED, async (event) => {
  const { _id, moderationMessage } = event.getEventPayload();

  await nftItemMetadataDraftService.updateNftItemMetadataDraft({
    _id,
    moderationMessage
  })
});

assetEventHandler.register(APP_EVENT.PROJECT_CONTENT_DRAFT_STATUS_UPDATED, async (event) => {
  const { _id, status } = event.getEventPayload();

  await nftItemMetadataDraftService.updateNftItemMetadataDraft({
    _id,
    status,
  })
});

assetEventHandler.register(APP_EVENT.PROJECT_CONTENT_METADATA_UPDATED, async (event) => {
  const {
    _id,
    metadata
  } = event.getEventPayload();

  await nftItemMetadataService.updateNftItemMetadata(_id, { metadata });
});


module.exports = assetEventHandler;