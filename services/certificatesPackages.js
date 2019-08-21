const CertificatesPackage = require('../schemas/certificatesPackage');

class CertificatesPackagesService {
  async findCertificatesPackages() {
    return CertificatesPackage.find();
  }

  async findCertificatesPackageById(id) {
    return CertificatesPackage.findOne({ _id: id });
  }
}

module.exports = new CertificatesPackagesService();
