import { createEnum } from '@deip/toolbox';


const APP_EVENT = createEnum({
  PROJECT_CREATED: 1,
  PROPOSAL_CREATED: 2
});


module.exports = APP_EVENT;