import { createEnum } from '@deip/toolbox/lib/enum';

const DEPOSIT_REQUEST_STATUS = createEnum({
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
})

export default DEPOSIT_REQUEST_STATUS;