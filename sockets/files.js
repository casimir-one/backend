import filesService from './../services/fileRef';
import fs from "fs";
import fsExtra from "fs-extra";
import util from 'util';
import path from 'path';
import deipRpc from '@deip/deip-rpc-client';


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

function getSessionKey(filename, uuid) {
  return `${filename}-${uuid}`
    .replace(/ /g, "-")
    .replace(/\W+/g, "-")
    .toLowerCase();
} 

async function getUploadSession({ organizationId, projectId, uuid, filename, size, hash, chunkSize, iv, filetype, fileAccess, permlink }) {

  const sessionKey = getSessionKey(filename, uuid);

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
      fileAccess != undefined &&
      permlink != undefined
    ) {

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

    const session = await getUploadSession(msg);
    if (!session) {
      try {
        let err = new Error("Upload session could not be established");
        return ack(err);
      } catch (err) { console.log(err); }
    }

    const { ws } = session;
    const { index, lastIndex, uuid, data, filename } = msg;

    if (index != lastIndex) {
      ws.write(new Buffer(new Uint8Array(data)), (err) => {
        try {
          if (err) {
            console.log(err);
            ack(err);
          } else {
            ack(null, { filename: filename, uuid: uuid, index: index, lastIndex: lastIndex });
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
            await filesService.upsertUploadedFileRef({ organizationId, projectId, filename, filetype, filepath, size, hash, iv, chunkSize, accessKeys: fileAccess });            
            ack(null, { filename: filename, uuid: uuid, index: index, lastIndex: lastIndex });
          }
        } catch (err) { console.log(err); }
      });
    }
  }
}

async function getDownloadSession({ organizationId, projectId, uuid, filename, filepath, size, hash, chunkSize, iv, filetype, fileAccess, permlink }) {

  const sessionKey = getSessionKey(filename, uuid);
  
  if (!downloadSessions[sessionKey]) {
    if (
      filepath !== undefined &&
      chunkSize !== undefined &&
      filename !== undefined
    ) {

      let fileSize;
      try {
        const stat = util.promisify(fs.stat);
        const stats = await stat(filepath);
        fileSize = stats.size;
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

      const session = { rs, filepath, filename, fileSize, chunkSize, index, lastIndex };

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

    const session = await getDownloadSession(msg);
    if (!session) {
      try {
        let err = new Error("Download session could not be established");
        return ack(err);
      } catch (err) { console.log(err); }
    }

    const { rs, lastIndex } = session;
    const { uuid, chunkSize, filename, filetype } = msg;
    const data = await readBytes(rs, chunkSize);

    try {
      ack(null, { filename: filename, uuid: uuid, data: data, filetype: filetype, index: ++session.index, lastIndex });
    } catch (err) { console.log(err); }
  }
}


export default {
  uploadEncryptedChunkHandler,
  downloadEncryptedChunkHandler
}