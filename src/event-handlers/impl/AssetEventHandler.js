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
    description,
    projectTokenOption
  } = event.getEventPayload();

  const data = {
    type: ASSET_TYPE.GENERAL_ASSET
  };

  if (projectTokenOption) {
    const { projectId, teamId, licenseRevenue } = projectTokenOption;
    data.tokenizedProjectId = projectId;
    data.type = ASSET_TYPE.PROJECT_ASSET
    if (licenseRevenue) {
      data.licenseRevenueHoldersShare = licenseRevenue.holdersShare
    }
  }

  const newAsset = await assetService.createAsset({
    stringSymbol: symbol,
    precision,
    issuer,
    description,
    maxSupply,
    ...data
  });
});


module.exports = assetEventHandler;