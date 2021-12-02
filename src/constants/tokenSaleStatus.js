import { createEnum } from '@deip/toolbox';

const TOKEN_SALE_STATUS = createEnum({
  ACTIVE: 1,
  FINISHED: 2,
  EXPIRED: 3,
  INACTIVE: 4,
})

export default TOKEN_SALE_STATUS;