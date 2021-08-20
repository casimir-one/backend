import BaseEventHandler from './../base/BaseEventHandler';
import APP_EVENT from './../../events/base/AppEvent';
import { AssetService } from './../../services';
import { ASSET_TYPE } from './../../constants/';


class AssetEventHandler extends BaseEventHandler {

  constructor() {
    super();
  }

}

const assetEventHandler = new AssetEventHandler();
const assetService = new AssetService();

assetEventHandler.register(APP_EVENT.ASSET_CREATED, async (event) => {

  const {
    entityId,
    issuer,
    symbol,
    precision,
    maxSupply,
    minBallance,
    description,
    projectTokenOption
  } = event.getEventPayload();

  const settings = {
    projectId: undefined,
    licenseRevenueHoldersShare: undefined,
    maxSupply,
    minBallance
  };

  if (projectTokenOption) {
    const { projectId, licenseRevenue } = projectTokenOption;
    settings.projectId = projectId;
    settings.licenseRevenueHoldersShare = licenseRevenue ? licenseRevenue.holdersShare : undefined;
  }

  const type = settings.projectId ? ASSET_TYPE.PROJECT : ASSET_TYPE.GENERAL;

  await assetService.createAsset({
    entityId,
    symbol,
    precision,
    issuer,
    description,
    type,
    settings
  });
});


module.exports = assetEventHandler;