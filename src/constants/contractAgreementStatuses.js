import { createEnum } from '@deip/toolbox/lib/enum';

const CONTRACT_AGREEMENT_STATUS = createEnum({
  PROPOSED: 1,
  PENDING: 2,
  APPROVED: 3,
  REJECTED: 4
});

export default CONTRACT_AGREEMENT_STATUS;