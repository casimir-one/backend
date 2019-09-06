import sharedFilesService from './../services/sharedFiles';

const getSharedFile = async (ctx) => {
  const sharedFileId = ctx.params.id;

  try {
    const sharedFile = await sharedFilesService.getSharedFileById(sharedFileId);
    ctx.status = 200;
    ctx.body = sharedFile;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

const getSharedFiles = async (ctx) => {
  const jwtUsername = ctx.state.user.username;

  try {
    const sharedFiles = await sharedFilesService.getAllSharedFilesByUsername(jwtUsername);
    ctx.status = 200;
    ctx.body = sharedFiles;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

const askPermission = async (ctx) => {
  try {
    console.log(JSON.stringify(ctx.request.body, null, 2));
    // sign tx; if success - go next
    const updatedSharedFile = await sharedFilesService.askPermissionToSharedFile(ctx.params.id);
    ctx.status = 200;
    ctx.body = updatedSharedFile;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

const unlockFile = async (ctx) => {
  try {
    const {
      signedTx,
      encyptedKey
    } = ctx.request.body;
    console.log(JSON.stringify(ctx.request.body, null, 2));
    // sign tx; if success - go next
    // add access key to a file
    const updatedSharedFile = await sharedFilesService.unlockSharedFile(ctx.params.id);
    ctx.status = 200;
    ctx.body = updatedSharedFile;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

export default {
  getSharedFile,
  getSharedFiles,
  askPermission,
  unlockFile,
}