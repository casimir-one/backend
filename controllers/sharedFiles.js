import fs from 'fs';
import sharedFilesService from './../services/sharedFiles';
import filesService from './../services/fileRef';

const getSharedFile = async (ctx) => {
  const sharedFileId = ctx.params.id;
  const isDownload = ctx.query.download === 'true';
  const jwtUsername = ctx.state.user.username;

  try {
    const sharedFile = await sharedFilesService.getSharedFileById(sharedFileId);
    if (!sharedFile) {
      ctx.status = 404;
      return;
    }
    if (![sharedFile.sender, sharedFile.receiver].includes(jwtUsername)) {
      ctx.status = 403;
      return;
    }
    if (isDownload) {
      const fileRef = await filesService.findFileRefById(sharedFile.fileRefId);
      ctx.response.set('Content-disposition', `attachment; filename="${fileRef.filename}.aes"`);
      ctx.body = fs.createReadStream(fileRef.filepath);
    } else {
      ctx.status = 200;
      ctx.body = sharedFile;
    }
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

const getSharedFiles = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const filter = {
    contractId: +ctx.query.contractId,
    fileRefId: ctx.query.fileRefId || '',
  };

  try {
    const sharedFiles = await sharedFilesService.getSharedFiles({
      username: jwtUsername,
      ...filter,
    });
    ctx.status = 200;
    ctx.body = sharedFiles;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

const askPermission = async (ctx) => {
  const sharedFileId = ctx.params.id;
  const jwtUsername = ctx.state.user.username;

  try {
    const sharedFile = await sharedFilesService.getSharedFileById(sharedFileId);
    if (sharedFile.receiver !== jwtUsername) {
      ctx.status = 403;
      return;
    }
    console.log(JSON.stringify(ctx.request.body, null, 2));
    // sign tx; if success - go next
    const updatedSharedFile = await sharedFilesService.askPermissionToSharedFile(sharedFileId);
    ctx.status = 200;
    ctx.body = updatedSharedFile;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};

const unlockFile = async (ctx) => {
  const sharedFileId = ctx.params.id;
  const jwtUsername = ctx.state.user.username;

  try {
    const {
      signedTx,
      accessKey,
    } = ctx.request.body;
    console.log(JSON.stringify(signedTx, null, 2));
    // sign tx; if success - go next
    const sharedFile = await sharedFilesService.getSharedFileById(sharedFileId);
    if (sharedFile.sender !== jwtUsername) {
      ctx.status = 403;
      return;
    }
    await filesService.addAccessKeyToFileRef(sharedFile.fileRefId, accessKey);
    const updatedSharedFile = await sharedFilesService.unlockSharedFile(sharedFileId);
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