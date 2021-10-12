import { createEnum } from '@deip/toolbox/lib/enum';

const ASSESSMENT_CRITERIA_TYPE = createEnum({
  UNKNOWN: 0,
  NOVELTY: 1,
  TECHNICAL_QUALITY: 2,
  METHODOLOGY: 3,
  IMPACT: 4,
  RATIONALITY: 5,
  REPLICATION: 6,
  COMMERCIALIZATION: 7,
});

export default ASSESSMENT_CRITERIA_TYPE;