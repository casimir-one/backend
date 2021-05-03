// const STEPPER = "stepper";
// const TEXT = "text";
// const TEXTAREA = "textarea";
// const SELECT = "select";
// const URL = "url";
// const VIDEO_URL = "video-url";
// const SWITCH = "switch";
// const CHECKBOX = "checkbox";
// const USER = "user";
// const DISCIPLINE = "discipline";
// const RESEARCH_GROUP = "research-group";

// const IMAGE = "image";
// const FILE = "file";
// const EXPRESS_LICENSING = "express-licensing";
// const NETWORK_CONTENT_ACCESS = "network-content-access";

// const ROADMAP = "roadmap";
// const PARTNERS = "partners";

// const EDUCATION = "education";
// const EMPLOYMENT = "employment";
// const DATE = "date";

const TEXT = 1;
const TEXTAREA = 2;
const SELECT = 3;
const SWITCH = 4;
const CHECKBOX = 5;
const DATE = 6; // date input
const DATE_TIME = 7; // date-time input
const FILE = 8; // file input
const IMAGE = 9; // image file / canvas
const URL = 10; // string
const NUMBER = 11; // int
const VIDEO_URL = 12; // string
const USER = 13; // ?? or FEATURE;
const STEPPER = 501;
const DISCIPLINE = 502;
const RESEARCH_GROUP = 503;
const EXPRESS_LICENSING = 504;
const NETWORK_CONTENT_ACCESS = 505;
const ROADMAP = 506;
const PARTNERS = 507;
const EDUCATION = 508;
const EMPLOYMENT = 509;
const CUSTOM = 1001; // simple composer / raw data, not to be confused with FEATURE
const FEATURE = 1002; // USE WITH CAUTION / is a components wrapper

const ATTRIBUTE_TYPE = {
  STEPPER,
  TEXT,
  TEXTAREA,
  SELECT,
  URL,
  VIDEO_URL,
  SWITCH,
  CHECKBOX,
  USER,
  DISCIPLINE,
  RESEARCH_GROUP,
  IMAGE,
  FILE,

  EXPRESS_LICENSING,
  NETWORK_CONTENT_ACCESS,

  ROADMAP,
  PARTNERS,
  EDUCATION,
  EMPLOYMENT,
  DATE,
  DATE_TIME,
  NUMBER,
  CUSTOM,
  FEATURE
};

export default ATTRIBUTE_TYPE;