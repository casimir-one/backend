import filesService from './../services/fileRef';
import sharedFilesService from './../services/sharedFiles';
import fs from "fs";
import fsExtra from "fs-extra";
import util from 'util';
import path from 'path';
import deipRpc from '@deip/deip-rpc-client';
import { authorizeResearchGroup } from './../services/auth'
import uuidv4 from "uuid/v4";


const uploadSessions = {};
const downloadSessions = {};


async function readable(rs) {
  return new Promise(r => rs.on('readable', r));
}

async function readBytes(rs, num) {
  let buf = rs.read(num);
  if (buf) {
    return new Promise(r => r(buf));
  }
  else {
    return new Promise(r => {
      readable(rs).then(() => {
        readBytes(rs, num).then(b => r(b));
      });
    });
  }
}

function getSessionKey(username, uuid) {
  return `${username}_${uuid}`;
} 

async function getUploadSession(username, { organizationId, projectId, uuid, filename, size, hash, chunkSize, iv, filetype, fileAccess }) {

  if (!uuid) uuid = uuidv4();
  const sessionKey = getSessionKey(username, uuid);

  if (!uploadSessions[sessionKey]) {
    if (
      organizationId != undefined &&
      projectId != undefined &&
      filename != undefined &&
      hash != undefined &&
      size != undefined &&
      chunkSize != undefined &&
      iv != undefined &&
      filetype != undefined &&
      fileAccess != undefined
    ) {

      const authorized = await authorizeResearchGroup(organizationId, username);
      if (!authorized) return null;

      const name = `${iv}_${chunkSize}_${sessionKey}`;
      const filepath = `files/${projectId}/${name.length <= 250 ? name : name.substr(0, 250)}.aes`;

      const stat = util.promisify(fs.stat);
      try {
        const check = await stat(filepath);
        console.log(`File session ${sessionKey} has expired`);
        return null;
      } catch(err) {}

      const ensureDir = util.promisify(fsExtra.ensureDir);
      await ensureDir(`files/${projectId}`);

      const ws = fs.createWriteStream(filepath, { 'flags': 'a' });
      console.log(`(${new Date()}) Writable Stream for ${sessionKey} session has been opened`);

      ws.on('close', function (err) {
        if (err) console.log(err);
        delete uploadSessions[sessionKey];
        console.log(`(${new Date()}) Writable Stream for ${sessionKey} session has been closed`);
      });

      ws.on('error', function (err) {
        delete uploadSessions[sessionKey];
        console.log(`(${new Date()}) Writable Stream for ${sessionKey} session has ended with an error:`, err);
      });

      const session = {
        ws,
        uuid,
        organizationId,
        projectId,
        filename,
        filetype,
        filepath,
        size,
        hash,
        iv,
        chunkSize,
        fileAccess
      }

      uploadSessions[sessionKey] = session;
      closeUploadSessionOnExpire(sessionKey);
      return uploadSessions[sessionKey];
    } else {
      return null; 
    }
  } else {
    return uploadSessions[sessionKey];
  }
}

function closeUploadSessionOnExpire(sessionKey, timeout = 900000) {
  setTimeout(() => {
    try {
      const expired = uploadSessions[sessionKey];
      if (expired != undefined) {
        expired.ws.close();
        console.log(`(${new Date()}) File session ${sessionKey} has expired and marked to be deleted`);
        delete uploadSessions[sessionKey];
        console.log(uploadSessions);
      }
    } catch (err) {
      console.log(`(${new Date()}) File session ${sessionKey} has expired but an error occurred while closing the stream:`, err);
      delete uploadSessions[sessionKey];
      console.log(uploadSessions);
    }
  }, timeout);
}

function uploadEncryptedChunkHandler(socket) {
  return async function (msg, ack) {

    const username = socket.user.username;
    const session = await getUploadSession(username, msg);
    if (!session) {
      try {
        let err = new Error("Upload session could not be established");
        return ack(err);
      } catch (err) { console.log(err); }
    }

    const { ws, uuid } = session;
    const { index, lastIndex, data } = msg;

    if (index != lastIndex) {
      ws.write(new Buffer(new Uint8Array(data)), (err) => {
        try {
          if (err) {
            console.log(err);
            ack(err);
          } else {
            ack(null, { uuid, index, lastIndex });
          }
        } catch (err) { console.log(err); }
      });
    } else {
      ws.end(new Buffer(new Uint8Array(data)), async (err) => {
        try {
          if (err) {
            console.log(err);
            ack(err);
          } else {
            const { organizationId, projectId, filename, filetype, filepath, size, hash, iv, chunkSize, fileAccess } = session;
            await filesService.upsertUploadedFileRef({ organizationId, projectId, filename, filetype, filepath, size, hash, iv, chunkSize, accessKeys: fileAccess, creator: username, uploader: username });            
            ack(null, { uuid, index, lastIndex });
          }
        } catch (err) { console.log(err); }
      });
    }
  }
}

async function getDownloadSession(username, { fileId, uuid }) {

  if (!uuid) uuid = uuidv4();
  const sessionKey = getSessionKey(username, uuid);
  
  if (!downloadSessions[sessionKey]) {
    if (fileId != undefined) {

      const fileRef = await filesService.findFileRefById(fileId);
      if (!fileRef) return null;

      const hasFileShared = await sharedFilesService.checkUserHasSharedFile({
        receiver: username,
        fileRefId: fileId
      });

      const authorizedInGroup = await authorizeResearchGroup(fileRef.organizationId, username);
      if (!authorizedInGroup && !hasFileShared) return null;

      const fileSize = fileRef.size;
      const filepath = fileRef.filepath;
      const chunkSize = fileRef.chunkSize;
      const filename = fileRef.filename;

      try {
        const stat = util.promisify(fs.stat);
        const stats = await stat(filepath);
      } catch (err) {
        return null; 
      }

      const index = -1;
      const lastIndex = Math.ceil(fileSize / chunkSize) - 1;

      const rs = fs.createReadStream(filepath, { highWaterMark: chunkSize });
      console.log(`(${new Date()}) Readable Stream for ${sessionKey} session has been opened`);

      rs.on('close', function (err) {
        if (err) console.log(err);
        delete downloadSessions[sessionKey];
        console.log(`(${new Date()}) Readable Stream for ${sessionKey} session has been closed`);
      });

      rs.on('error', function (err) {
        delete downloadSessions[sessionKey];
        console.log(`(${new Date()}) Readable Stream for ${sessionKey} session has ended with an error:`, err);
      });

      const session = { rs, uuid, filepath, filename, fileSize, chunkSize, index, lastIndex };

      downloadSessions[sessionKey] = session;
      closeDownloadSessionOnExpire(sessionKey);
      return downloadSessions[sessionKey];
    } else {
      return null;
    }
  } else {
    return downloadSessions[sessionKey];
  }
}

function closeDownloadSessionOnExpire(sessionKey, timeout = 900000) {
  setTimeout(() => {
    try {
      const expired = downloadSessions[sessionKey];
      if (expired != undefined) {
        expired.rs.close();
        console.log(`File session ${sessionKey} has expired and marked to be deleted`);
        delete downloadSessions[sessionKey];
        console.log(downloadSessions);
      }
    } catch (err) {
      console.log(`File session ${sessionKey} has expired but an error occurred while closing the stream:`, err);
      delete downloadSessions[sessionKey];
      console.log(downloadSessions);
    }
  }, timeout);
}

function downloadEncryptedChunkHandler(socket) {
  return async function (msg, ack) {

    const username = socket.user.username;
    const session = await getDownloadSession(username, msg);
    if (!session) {
      try {
        let err = new Error("Download session could not be established");
        return ack(err);
      } catch (err) { console.log(err); }
    }

    const { rs, lastIndex, uuid, chunkSize } = session;
    const { fileId } = msg;
    const data = await readBytes(rs, chunkSize);

    try {
      ack(null, { fileId, uuid, data, index: ++session.index, lastIndex });
    } catch (err) { console.log(err); }
  }
}


export default {
  uploadEncryptedChunkHandler,
  downloadEncryptedChunkHandler
}