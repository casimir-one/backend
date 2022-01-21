import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { AssetService } from './../../services';
import { ASSET_TYPE } from '@deip/constants';


class AssetEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const assetEventHandler = new AssetEventHandler();
const assetService = new AssetService();

assetEventHandler.register(APP_EVENT.FT_CREATED, async (event) => {

  const {
    entityId,
    issuer,
    symbol,
    precision,
    maxSupply,
    minBallance,
    description,
    projectTokenSettings
  } = event.getEventPayload();

  const settings = {
    projectId: undefined,
    licenseRevenueHoldersShare: undefined,
    maxSupply,
    minBallance
  };

  if (projectTokenSettings) { // keep this until we have working F-NFT
    const { projectId, licenseRevenue } = projectTokenSettings;
    settings.projectId = projectId;
    settings.licenseRevenueHoldersShare = licenseRevenue ? licenseRevenue.holdersShare : undefined;
  }

  await assetService.createAsset({
    entityId,
    symbol,
    precision,
    issuer,
    description,
    type: ASSET_TYPE.FT,
    settings
  });
});

assetEventHandler.register(APP_EVENT.NFT_CREATED, async (event) => {

  const {
    entityId,
    issuer,
    symbol,
    description,
    projectTokenSettings
  } = event.getEventPayload();

  const settings = {
    projectId: undefined,
    licenseRevenueHoldersShare: undefined,
  };

  if (projectTokenSettings) { // keep this until we have working F-NFT
    const { projectId, licenseRevenue } = projectTokenSettings;
    settings.projectId = projectId;
    settings.licenseRevenueHoldersShare = licenseRevenue ? licenseRevenue.holdersShare : undefined;
  }

  await assetService.createAsset({
    entityId,
    symbol,
    issuer,
    description,
    type: ASSET_TYPE.NFT,
    settings
  });
});


module.exports = assetEventHandler;