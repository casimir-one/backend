import { createEnum } from '@deip/toolbox/lib/enum';

const PROJECT_STATUS = createEnum({
  PROPOSED: 1,
  APPROVED: 2,
  DELETED: 3,
});

export default PROJECT_STATUS;


