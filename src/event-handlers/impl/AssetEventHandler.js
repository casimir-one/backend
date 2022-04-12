import BaseEventHandler from './../base/BaseEventHandler';
import { AssetService, NonFungibleTokenService, NonFungibleTokenDtoService, FungibleTokenService } from './../../services';
import { ASSET_TYPE, APP_EVENT } from '@deip/constants';


class AssetEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const assetEventHandler = new AssetEventHandler();
const assetService = new AssetService();
const fungibleTokenService = new FungibleTokenService();
const nonFungibleTokenService = new NonFungibleTokenService();
const nonFungibleTokenDtoService = new NonFungibleTokenDtoService();

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

assetEventHandler.register(APP_EVENT.NFT_CREATED, async (event) => {

  const {
    entityId,
    issuer,
    symbol,
    name,
    description,
    metadata,
    metadataHash
  } = event.getEventPayload();

  await nonFungibleTokenService.createNonFungibleToken({
    classId: entityId,
    instancesCount: 0,
    metadata,
    metadataHash,
    issuer,
    name,
    description
  })

  await assetService.createAsset({
    entityId,
    symbol,
    issuer,
    description,
    type: ASSET_TYPE.NFT
  });
});

assetEventHandler.register(APP_EVENT.NFT_ISSUED, async (event) => {

  const {
    issuer,
    classId,
    instanceId,
    recipient,
    metadata,
    metadataHash
  } = event.getEventPayload();
  const nft = await nonFungibleTokenDtoService.getNonFungibleTokenClass(classId);

  await nonFungibleTokenService.updateNonFungibleToken({
    classId,
    instancesCount: nft.instancesCount + 1
  })
});


module.exports = assetEventHandler;