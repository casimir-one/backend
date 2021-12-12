import { createEnum } from '@deip/toolbox';

const ASSET_TYPE = createEnum({
  COIN: 1,
  NFT: 2,
  CORE: 3
})

export default ASSET_TYPE;