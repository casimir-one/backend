import AssetSchema from './../../../schemas/AssetSchema';

class AssetService {

  async createAsset({
    stringSymbol,
    precision,
    issuer,
    description,
    maxSupply,
    tokenizedProjectId,
    licenseRevenueHoldersShare,
    type
  }) {
    const newAsset = new AssetSchema({
      _id: stringSymbol,
      stringSymbol,
      precision,
      issuer,
      description,
      maxSupply,
      tokenizedProjectId,
      licenseRevenueHoldersShare,
      type
    })
    const savedAsset = await newAsset.save();
    return savedAsset.toObject();
  }
}

export default AssetService;