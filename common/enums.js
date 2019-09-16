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