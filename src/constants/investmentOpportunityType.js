import { createEnum } from '@deip/toolbox/lib/enum';

const INVESTMENT_OPPORTUNITY_TYPE = createEnum({
  UNKNOWN: 0,
  PROJECT_TOKEN_SALE: 1,
});

export default INVESTMENT_OPPORTUNITY_TYPE;