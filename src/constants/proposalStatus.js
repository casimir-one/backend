import { createEnum } from '@deip/toolbox/lib/enum';

const PROPOSAL_STATUS = createEnum({
  PENDING: 1,
  APPROVED: 2,
  REJECTED: 3,
  FAILED: 4,
  EXPIRED: 5
});

export default PROPOSAL_STATUS;