const ATTR_TYPES = {
  TEXT: 'text',
  TEXTAREA: 'textarea',
  SELECT: 'select',
  SWITCH: 'switch',
  CHECKBOX: 'checkbox',
  DATE: 'date',
  DATE_TIME: 'dateTime',
  FILE: 'file',
  IMAGE: 'image',
  URL: 'url',
  NUMBER: 'number',
  VIDEO_URL: 'videoUrl',
  USER: 'userSelect', // feature
  AVATAR: 'avatar',
  LOCATION: 'location',
  RICHTEXT: 'richText',
  STEPPER: 'stepper', // feature
  DOMAIN: 'domain', // feature
  TEAM: 'teamSelect', // feature
  EXPRESS_LICENSING: 'expressLicensing', // feature
  NETWORK_CONTENT_ACCESS: 'networkContentAccess', // feature
  ROADMAP: 'roadmap', // custom
  PARTNERS: 'partners', // custom
  EDUCATION: 'education', // custom
  EMPLOYMENT: 'employment', // custom
  CUSTOM: 'custom'
};

const ATTR_SCOPES = {
  PROJECT: 'project',
  USER: 'user',
  TEAM: 'team'
};

export { ATTR_TYPES, ATTR_SCOPES };