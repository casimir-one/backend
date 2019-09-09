import SharedFile from '../schemas/sharedFile';

async function createSharedFile ({
  fileRefId, filename, sender, receiver,
  contractId, contractTitle, status = 'locked',
}) {
  const newSharedFile = new SharedFile({
    fileRefId, filename, sender, receiver,
    contractTitle, status
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
  fileRefId, receiver
}) {
  const existingShare = await SharedFile.findOne({
    fileRefId, receiver
  });

  return !!existingShare;
}

async function checkFileAlreadyShared ({
  fileRefId, receiver, sender
}) {
  const existingShare = await SharedFile.findOne({
    fileRefId, receiver, sender
  });

  return !!existingShare;
}

async function getSharedFiles ({
  username, contractId,
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

  return SharedFile.find(query);
}

async function askPermissionToSharedFile (_id) {
  return SharedFile.findOneAndUpdate({ _id }, {
    $set: {
      status: 'access_requested'
    }
  }, { new: true });
}

async function unlockSharedFile (_id) {
  return SharedFile.findOneAndUpdate({ _id }, {
    $set: {
      status: 'unlocked'
    }
  }, { new: true });
}

export default {
  createSharedFile,
  getSharedFileById,
  getSharedFiles,
  checkFileAlreadyShared,
  askPermissionToSharedFile,
  unlockSharedFile,
  checkUserHasSharedFile
}
