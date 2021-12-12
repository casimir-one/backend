import { createEnum } from '@deip/toolbox';

const ASSET_TYPE = createEnum({
  GENERAL: 1,
  PROJECT: 2,
  CORE: 3
})

export default ASSET_TYPE;