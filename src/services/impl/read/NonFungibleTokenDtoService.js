import BaseService from './../../base/BaseService';
import config from './../../../config';
import { ChainService } from '@deip/chain-service';
import NonFungibleTokenSchema from './../../../schemas/NonFungibleTokenSchema';


class NonFungibleTokenDtoService extends BaseService {

  constructor(options = { scoped: true }) {
    super(NonFungibleTokenSchema, options);
  }

  async mapNonFungibleTokens(nonFungibleTokens) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();
    const chainNonFungibleTokens = await chainRpc.getNonFungibleTokenClassesAsync();
    
    return nonFungibleTokens.map((nonFungibleToken) => {

      const chainNonFungibleToken = chainNonFungibleTokens.find((chainNonFungibleToken) => chainNonFungibleToken && chainNonFungibleToken.classId == nonFungibleToken._id);
      if (!chainNonFungibleToken) {
        console.warn(`NonFungibleToken with classId '${nonFungibleToken._id}' is not found in the Chain`);
      }

      return { 
        _id: nonFungibleToken._id,
        portalId: nonFungibleToken.portalId,
        instancesCount: chainNonFungibleToken ? chainNonFungibleToken.instancesCount : nonFungibleToken.instancesCount,
        classId: nonFungibleToken._id,
        issuer: nonFungibleToken.issuer,
        name: nonFungibleToken.name,
        symbol: nonFungibleToken.symbol,
        metadata: nonFungibleToken.metadata,
        metadataHash: nonFungibleToken.metadataHash,
        type: nonFungibleToken.type,

        // @deprecated
        settings: nonFungibleToken.metadata
      }

    });
  }

  async getNonFungibleTokenClass(classId) {
    const nft = await this.findOne({ _id: classId });
    const [result] = await this.mapNonFungibleTokens([nft]);
    return result;
  }

  async getNonFungibleTokenClasses() {
    const nfts = await this.findMany({});
    const result = await this.mapNonFungibleTokens(nfts);
    return result;
  }

  async getNonFungibleTokenClassInstancesByOwner(account, classId) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const result = await chainRpc.getNonFungibleTokenClassInstancesByOwnerAsync(account, classId);
    return result;
  }

  async getNonFungibleTokenClassesInstancesByOwner(account) {
    const chainService = await ChainService.getInstanceAsync(config);
    const chainRpc = chainService.getChainRpc();

    const result = await chainRpc.getNonFungibleTokenClassesInstancesByOwnerAsync(account);
    return result;
  }
}


export default NonFungibleTokenDtoService;