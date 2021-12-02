import { createEnum } from '@deip/toolbox/lib/enum';

const USER_INVITE_STATUS = createEnum({
  SENT: 1,
  APPROVED: 2,
  REJECTED: 3,
  EXPIRED: 4,
  PROPOSED: 5, //deprecated
});

export default USER_INVITE_STATUS;