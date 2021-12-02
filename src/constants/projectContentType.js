import { createEnum } from '@deip/toolbox';

const PROJECT_CONTENT_TYPES = createEnum({
  UNKNOWN: 0,
  ANNOUNCEMENT: 1,
  // FINAL_RESULT: 2,
  MILESTONE_ARTICLE: 3,
  MILESTONE_BOOK: 4,
  MILESTONE_CHAPTER: 5,
  MILESTONE_CODE: 6,
  MILESTONE_CONFERENCE_PAPER: 7,
  MILESTONE_COVER_PAGE: 8,
  MILESTONE_DATA: 9,
  MILESTONE_EXPERIMENT_FINDINGS: 10,
  MILESTONE_METHOD: 11,
  MILESTONE_NEGATIVE_RESULTS: 12,
  MILESTONE_PATENT: 13,
  MILESTONE_POSTER: 14,
  MILESTONE_PREPRINT: 15,
  MILESTONE_PRESENTATION: 16,
  MILESTONE_RAW_DATA: 17,
  MILESTONE_PROJECT_PROPOSAL: 18,
  MILESTONE_TECHNICAL_REPORT: 19,
  MILESTONE_THESIS: 20,
});

let contentTypesMap = {
  [PROJECT_CONTENT_TYPES.ANNOUNCEMENT]: { text: 'Announcement', order: 1 },
  // [PROJECT_CONTENT_TYPES.FINAL_RESULT]: { text: 'Final Result', order: 20 },
  [PROJECT_CONTENT_TYPES.MILESTONE_ARTICLE]: { text: 'Article', order: 2 },
  [PROJECT_CONTENT_TYPES.MILESTONE_BOOK]: { text: 'Book', order: 3 },
  [PROJECT_CONTENT_TYPES.MILESTONE_CHAPTER]: { text: 'Chapter', order: 4 },
  [PROJECT_CONTENT_TYPES.MILESTONE_CODE]: { text: 'Code', order: 5 },
  [PROJECT_CONTENT_TYPES.MILESTONE_CONFERENCE_PAPER]: { text: 'Conference paper', order: 6 },
  [PROJECT_CONTENT_TYPES.MILESTONE_COVER_PAGE]: { text: 'Cover page', order: 7 },
  [PROJECT_CONTENT_TYPES.MILESTONE_DATA]: { text: 'Data', order: 8 },
  [PROJECT_CONTENT_TYPES.MILESTONE_EXPERIMENT_FINDINGS]: { text: 'Experiment findings', order: 9 },
  [PROJECT_CONTENT_TYPES.MILESTONE_METHOD]: { text: 'Method', order: 10 },
  [PROJECT_CONTENT_TYPES.MILESTONE_NEGATIVE_RESULTS]: { text: 'Negative results', order: 11 },
  [PROJECT_CONTENT_TYPES.MILESTONE_PATENT]: { text: 'Patent', order: 12 },
  [PROJECT_CONTENT_TYPES.MILESTONE_POSTER]: { text: 'Poster', order: 13 },
  [PROJECT_CONTENT_TYPES.MILESTONE_PREPRINT]: { text: 'Preprint', order: 14 },
  [PROJECT_CONTENT_TYPES.MILESTONE_PRESENTATION]: { text: 'Presentation', order: 15 },
  [PROJECT_CONTENT_TYPES.MILESTONE_RAW_DATA]: { text: 'Raw data', order: 16 },
  [PROJECT_CONTENT_TYPES.MILESTONE_PROJECT_PROPOSAL]: { text: 'Project proposal', order: 17 },
  [PROJECT_CONTENT_TYPES.MILESTONE_TECHNICAL_REPORT]: { text: 'Technical report', order: 18 },
  [PROJECT_CONTENT_TYPES.MILESTONE_THESIS]: { text: 'Thesis', order: 19 }
};

contentTypesMap = Object.keys(contentTypesMap).reduce((obj, key) => {
  obj[key] = {
    id: key,
    type: PROJECT_CONTENT_TYPES[key].toLowerCase(),
    ...contentTypesMap[key]
  };
  return obj;
}, {});
const CONTENT_TYPES_MAP = [...Object.values(contentTypesMap)].sort((a, b) => a.order - b.order);

export { CONTENT_TYPES_MAP, PROJECT_CONTENT_TYPES };