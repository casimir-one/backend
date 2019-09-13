import fs from 'fs';
import deipRpc from '@deip/deip-rpc-client';
import sharedFilesService from './../services/sharedFiles';
import filesService from './../services/fileRef';
import { sendTransaction } from './../utils/blockchain';

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
  const signedTx = ctx.request.body;

  try {
    const sharedFile = await sharedFilesService.getSharedFileById(sharedFileId);
    if (sharedFile.receiver !== jwtUsername) {
      ctx.status = 403;
      return;
    }
    const {
      contract_id: contratId,
      encrypted_payload_hash: encryptedPayloadHash,
    } = signedTx['operations'][0][1];
    if (sharedFile.contractId !== contratId) {
      ctx.status = 400;
      return;
    }
    const result = await sendTransaction(signedTx);
    if (!result.isSuccess) {
      ctx.status = 400;
      ctx.body = 'Error while create permission request';
      return;
    }

    const permissionRequest = await deipRpc.api.getNdaContractRequestByContractIdAndHashAsync(contratId, encryptedPayloadHash);
    const updatedSharedFile = await sharedFilesService.askPermissionToSharedFile(sharedFileId, permissionRequest.id);
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
    const sharedFile = await sharedFilesService.getSharedFileById(sharedFileId);
    if (sharedFile.sender !== jwtUsername) {
      ctx.status = 403;
      return;
    }
    const {
      request_id: permissionRequestId,
    } = signedTx['operations'][0][1];
    if (sharedFile.permissionRequestId !== permissionRequestId) {
      ctx.status = 400;
      return;
    }
    const result = await sendTransaction(signedTx);
    if (!result.isSuccess) {
      ctx.status = 400;
      ctx.body = 'Error while create permission request';
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