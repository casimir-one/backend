const _ = require('lodash');

const notificationType = {
  NDA_CONTRACT_RECEIVED: 'nda_contract_received',
  NDA_CONTRACT_SIGNED: 'nda_contract_signed',
  NDA_CONTRACT_DECLINED: 'nda_contract_declined',
  FILE_SHARED: 'file_shared',
  FILE_ACCESS_REQUESTED: 'file_access_requested',
  FILE_ACCESS_GRANTED: 'file_access_granted',
};
module.exports.notificationType = notificationType;
module.exports.notificationTypeValues = _.values(notificationType);

const additionalPackageType = {
  CERTIFICATES: 'certificates',
  CONTRACTS: 'contracts',
  FILES_SHARES: 'files_shares',
};
const additionalPackageTypeValues = _.values(additionalPackageType);
module.exports.additionalPackageType = additionalPackageType;
module.exports.additionalPackageTypeValues = additionalPackageTypeValues;

const sharedFileStatus = {
  LOCKED: 'locked',
  ACCESS_REQUESTED: 'access_requested',
  UNLOCKED: 'unlocked',
};
module.exports.sharedFileStatus = sharedFileStatus;
module.exports.sharedFileStatusValues = _.values(sharedFileStatus);

// https://stripe.com/docs/api/subscriptions/object#subscription_object-status
const stripeSubscriptionStatus = {
  INCOMPLETE: 'incomplete',
  INCOMPLETE_EXPIRED: 'incomplete_expired',
  TRIALING: 'trialing',
  ACTIVE: 'active',
  PAST_DUE: 'past_due',
  CANCELED: 'canceled',
  UNPAID: 'unpaid',
};
module.exports.stripeSubscriptionStatus = stripeSubscriptionStatus;

const inviteStatus = {
  UNSENT: 'unsent',
  PENDING: 'pending',
  CLAIMED: 'claimed',
  ACCEPTED: 'accepted'
};
module.exports.inviteStatus = inviteStatus;
module.exports.inviteStatusValues = _.values(inviteStatus);

const mailchimpEvents = {
  REACH_REGISTRATION_PAGE: 'reached_registration_step_1',
  CREATED_VERIFICATION_TOKEN: 'initiated_registration',
  VERIFIED_EMAIL: 'reached_registration_step_2',
  FILLED_USERNAME_FORM: 'filled_registration_form',
  REACH_CARD_FORM: 'reached_card_form',
  REGISTERED: 'registered'
};
module.exports.mailchimpEvents = mailchimpEvents;
module.exports.mailchimpEventsValues = _.values(mailchimpEvents);
