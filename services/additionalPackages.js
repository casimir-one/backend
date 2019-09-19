const AdditionalPackage = require('../schemas/additionalPackage');

class AdditionalPackagesService {
  async findAdditionalPackages(filter = {}) {
    const query = {};
    if (filter.active !== undefined) {
      query.active = filter.active;
    }
    return AdditionalPackage.find(query);
  }

  async findAdditionalPackageById(_id) {
    return AdditionalPackage.findOne({ _id });
  }
}

module.exports = new AdditionalPackagesService();
