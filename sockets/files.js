import { setUploadedAndTimestampedStatus } from './../services/fileRef';
import fs from "fs";
import fsExtra from "fs-extra";
import util from 'util';
import path from 'path';


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

async function getUploadSession({ organizationId, projectId, uuid, filename, size, hash, chunkSize, iv, filetype, fileAccess, permlink }) {
  
  const sessionKey = `${filename}-${uuid}`
    .replace(/ /g, "-")
    .replace(/\W+/g, "-")
    .toLowerCase();

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
      console.log(`Writable Stream for ${sessionKey} session has been opened (${new Date()})`);

      ws.on('close', function (err) {
        if (err) console.log(err);
        delete uploadSessions[sessionKey];
        console.log(`Writable Stream for ${sessionKey} session has been closed: (${new Date()})`);
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
      let expired = uploadSessions[sessionKey];
      if (expired !== undefined) {
        expired.ws.close();
        console.log(`File session ${sessionKey} has expired and marked to be deleted`);
        delete uploadSessions[sessionKey];
        console.log(uploadSessions);
      }
    } catch (err) {
      console.log(`File session ${sessionKey} has expired but an error occurred while closing the stream:`, err);
      delete uploadSessions[sessionKey];
      console.log(uploadSessions);
    }

  }, timeout);
}


function uploadEncryptedChunkHandler(socket) {
  return async function (msg, ack) {

    const session = await getUploadSession(msg);
    const { ws } = session;
    const { index, lastIndex, uuid, data, filename } = msg;

    if (index != lastIndex) {
      ws.write(new Buffer(new Uint8Array(data)), (err) => {
        if (err) {
          console.log(err);
          ack(err);
        } else {
          ack(null, { filename: filename, uuid: uuid, index: index, lastIndex: lastIndex });
        }
      });
    } else {
      ws.end(new Buffer(new Uint8Array(data)), async (err) => {
        if (err) {
          console.log(err);
          ack(err);
        } else {
          let { organizationId, projectId, filename, filetype, filepath, size, hash, iv, chunkSize, fileAccess } = session;
          await setUploadedAndTimestampedStatus(projectId, hash, iv, chunkSize, filepath, fileAccess);
          ack(null, { filename: filename, uuid: uuid, index: index, lastIndex: lastIndex });
        }
      })
    }
  }
}


async function getDownloadSession({ organizationId, projectId, uuid, filename, filepath, size, hash, chunkSize, iv, filetype, fileAccess, permlink }) {

  const sessionKey = `${filename}-${uuid}`
    .replace(/ /g, "-")
    .replace(/\W+/g, "-")
    .toLowerCase();

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
        console.log(err);
        return null; 
      }

      const index = -1;
      const lastIndex = Math.ceil(fileSize / chunkSize) - 1;

      const rs = fs.createReadStream(filepath, { highWaterMark: chunkSize });
      console.log(`Readable Stream for ${sessionKey} session has been opened (${new Date()})`);

      rs.on('close', function (err) {
        if (err) console.log(err);
        delete downloadSessions[sessionKey];
        console.log(`Readable Stream for ${sessionKey} session has been closed (${new Date()})`);
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
      let expired = downloadSessions[sessionKey];
      if (expired !== undefined) {
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
    const { rs, lastIndex } = session;
    const { uuid, chunkSize, filename, filetype } = msg;
    let data = await readBytes(rs, chunkSize);

    ack(null, { filename: filename, uuid: uuid, data: data, filetype: filetype, index: ++session.index, lastIndex })
  }
}


export default {
  uploadEncryptedChunkHandler,
  downloadEncryptedChunkHandler
}