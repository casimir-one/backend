import BaseService from '../../base/BaseService';
import NFTItemMetadataDraftSchema from '../../../schemas/NFTItemMetadataDraftSchema';

class NFTItemMetadataDraftService extends BaseService {

  constructor(options = { scoped: true }) { 
    super(NFTItemMetadataDraftSchema, options);
  }

  async createNFTItemMetadataDraft({
    _id,
    nftCollectionId,
    nftItemId,
    owner,
    attributes,
    hash,
    algo,
    status,
    authors,
  }) {
    const draft = await this.createOne({
      _id,
      nftCollectionId,
      nftItemId,
      owner,
      attributes,
      hash,
      algo,
      status,
      authors,
    });

    return draft;
  }

  async updateNFTItemMetadataDraft({
    _id: id,
    attributes,
    hash,
    algo,
    status,
    authors,
    moderationMessage,
    queueNumber,
    lazySellProposalId //TODO: remove when we have onchain market
  }) {
    const updatedDraft = await this.updateOne({ _id: id }, {
      attributes,
      hash,
      algo,
      status,
      authors,
      moderationMessage,
      queueNumber,
      lazySellProposalId //TODO: remove when we have onchain market
    });

    return updatedDraft;
  }

  async deleteNFTItemMetadataDraft(id) {
    const deletedDraft = await this.deleteOne({ _id: id});
    return deletedDraft;
  }

  async deleteNFTItemMetadataDraftByHash(nftCollectionId, hash) {
    const deletedDraft = await this.deleteOne({ nftCollectionId, hash });
    return deletedDraft;
  }

  async getNFTItemMetadataDraft(id) {
    const draft = await this.findOne({ _id: id });
    return draft;
  }
  
}

export default NFTItemMetadataDraftService;