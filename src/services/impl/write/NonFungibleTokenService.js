import NonFungibleTokenSchema from './../../../schemas/NonFungibleTokenSchema';
import BaseService from './../../base/BaseService';


class NonFungibleTokenService extends BaseService {

  constructor(options = { scoped: true }) {
    super(NonFungibleTokenSchema, options);
  }

  async createNonFungibleToken({
    classId,
    instancesCount,
    metadata,
    metadataHash,
    issuer,
    name,
    description
  }) {

    const result = await this.createOne({
      _id: classId,
      instancesCount,
      metadata,
      metadataHash,
      issuer,
      name,
      description
    });

    return result;
  }

  async updateNonFungibleToken({
    classId,
    instancesCount
  }) {

    const result = await this.updateOne({ _id: classId }, {
      instancesCount
    });

    return result;
  }

  async getNonFungibleTokenClass(classId) {
    const nft = await this.findOne({ _id: classId });
    return nft;
  }
}


export default NonFungibleTokenService;