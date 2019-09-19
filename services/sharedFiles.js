const SharedFile = require('../schemas/sharedFile');
const { sharedFileStatus } = require('./../common/enums');

async function createSharedFile ({
  fileRefId, filename, sender, receiver,
  contractId, status = sharedFileStatus.LOCKED,
}) {
  const newSharedFile = new SharedFile({
    fileRefId, filename, sender, receiver, status
  });
  if (contractId || contractId === 0) {
    newSharedFile.contractId = `${contractId}`;
  }
  return newSharedFile.save();
}

async function getSharedFileById (_id) {
  return SharedFile.findOne({ _id });
}

async function checkUserHasSharedFile ({
  fileRefId, receiver, status
}) {
  const query = {
    fileRefId, receiver
  };
  if (status) {
    query.status = status;
  }
  const existingShare = await SharedFile.findOne(query);

  return !!existingShare;
}

async function getSharedFiles ({
  username, contractId, fileRefId,
  type = 'all'
}) {
  const query = {};

  switch (type) {
    case 'incoming':
      query.receiver = username;
      break;
    case 'outcoming':
      query.sender = username;
      break;
    case 'all':
    default:
      if (!query.$or) {
        query.$or = [];
      }
      query.$or.push({
        sender: username
      }, {
        receiver: username
      });
      break;
  }

  if (contractId || contractId === 0) {
    query.contractId = `${contractId}`;
  }
  if (fileRefId) {
    query.fileRefId = fileRefId;
  }

  return SharedFile.find(query);
}

async function askPermissionToSharedFile (_id, permissionRequestId) {
  return SharedFile.findOneAndUpdate({ _id }, {
    $set: {
      status: sharedFileStatus.ACCESS_REQUESTED,
      permissionRequestId: `${permissionRequestId}`,
    }
  }, { new: true });
}

async function unlockSharedFile (_id) {
  return SharedFile.findOneAndUpdate({ _id }, {
    $set: {
      status: sharedFileStatus.UNLOCKED,
    }
  }, { new: true });
}

export default {
  createSharedFile,
  getSharedFileById,
  getSharedFiles,
  askPermissionToSharedFile,
  unlockSharedFile,
  checkUserHasSharedFile
}
