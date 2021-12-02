import { createEnum } from '@deip/toolbox/lib/enum';

const REVIEW_REQUEST_STATUS = createEnum({
  PENDING: 1,
  APPROVED: 2,
  DENIED: 3
});

export default REVIEW_REQUEST_STATUS;