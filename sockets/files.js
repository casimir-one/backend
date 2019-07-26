import { setUploadedAndTimestampedStatus } from './../services/fileRef';
import fs from "fs";
import fsExtra from "fs-extra";
import util from 'util';
import path from 'path';


const uploadSessions = {};
const downloadSessions = {};

function getSession(filename, uuid) {
  return `${filename}-${uuid}`
    .replace(/ /g, "-")
    .replace(/\W+/g, "-")
    .toLowerCase();
}

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

function clearSessionAfterTimeout(sessions, session, timeout = 900000) { // 15 min

  setTimeout(() => {
    try {
      let expired = sessions[session];
      if (expired !== undefined) {
        if (expired.rs) {
          expired.rs.close();
        } else {
          expired.ws.close();
        }
        
        console.log(`File session ${session} has expired and marked to be deleted`);
        delete sessions[session];
        console.log(sessions);
      }
    } catch (err) {
      console.log(`File session ${session} has expired but an error occurred while closing the stream:`);
      console.log(err);
      delete sessions[session];
      console.log(sessions);
    }

  }, timeout);
}


function uploadEncryptedChunkHandler(socket) {
  return async function (msg) {

    const session = getSession(msg.uuid, msg.filename);
    if (!uploadSessions[session]) {
      let { organizationId, projectId, filename, size, hash, chunkSize, iv, filetype, fileAccess, permlink } = msg;

      if (organizationId != undefined &&
        projectId != undefined &&
        filename != undefined &&
        hash != undefined &&
        size != undefined &&
        chunkSize != undefined &&
        iv != undefined &&
        filetype != undefined &&
        fileAccess != undefined &&
        permlink != undefined) {


        let name = `${iv}_${chunkSize}_${session}`;
        const filepath = `files/${projectId}/${name.length <= 250 ? name : name.substr(0, 250)}.aes`;
        const stat = util.promisify(fs.stat);
        try {
          const check = await stat(filepath);
          console.log(`File session ${session} has expired`);
          return;

        } catch (err) {

          const ensureDir = util.promisify(fsExtra.ensureDir);
          await ensureDir(`files/${projectId}`);

          let ws = fs.createWriteStream(filepath, { 'flags': 'a' });
          console.log(`Writable Stream for ${session} session has been opened (${new Date()})`);
          uploadSessions[session] = {
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
            fileAccess,
            isEnded: false
          };

          clearSessionAfterTimeout(uploadSessions, session);

          ws.on('close', function (err) {
            if (err) console.log(err);
            delete uploadSessions[session];
            console.log(`Writable Stream for ${session} session has been closed: (${new Date()})`);
          });
        }

      } else {
        console.log(`Message malformed:`);
        console.log(msg);
        return;
      }
    }

    if (msg.index != msg.lastIndex) {

      uploadSessions[session].ws.write(new Buffer(new Uint8Array(msg.data)), (err) => {
        if (err) {
          console.log(err);
        } else {
          socket.emit('uploaded_encrypted_chunk', { filename: msg.filename, uuid: msg.uuid, index: msg.index, lastIndex: msg.lastIndex });
        }
      });
    } else {
      uploadSessions[session].ws.end(new Buffer(new Uint8Array(msg.data)), async (err) => {
        uploadSessions[session].isEnded = true;
        if (err) {
          console.log(err);
        } else {
          let { organizationId, projectId, filename, filetype, filepath, size, hash, iv, chunkSize, fileAccess } = uploadSessions[session];
          await setUploadedAndTimestampedStatus(projectId, hash, iv, chunkSize, filepath, fileAccess);
          socket.emit('uploaded_encrypted_chunk', { filename: msg.filename, uuid: msg.uuid, index: msg.index, lastIndex: msg.lastIndex });
        }
      })
    }

  }
}


function downloadEncryptedChunkHandler(socket) {
  return async function (msg) {

    const session = getSession(msg.uuid, msg.filename);
    if (!downloadSessions[session]) {
      let { filename, filepath, chunkSize } = msg;

      const stat = util.promisify(fs.stat);

      try {

        if (filepath !== undefined &&
          chunkSize !== undefined &&
          filename !== undefined) {

          const stats = await stat(filepath);
          let fileSizeInBytes = stats.size;
          let index = -1;
          let lastIndex = Math.ceil(fileSizeInBytes / chunkSize) - 1;

          let rs = fs.createReadStream(filepath, { highWaterMark: chunkSize });
          console.log(`Readable Stream for ${session} session has been opened (${new Date()})`);

          downloadSessions[session] = { rs, isEnded: false, index, filepath, filename, lastIndex, chunkSize };
          clearSessionAfterTimeout(downloadSessions, session);

          rs.on('end', function () {
            downloadSessions[session].isEnded = true;
          })
            .on('close', function (err) {
              if (err) console.log(err);
              delete downloadSessions[session];
              console.log(`Readable Stream for ${session} session has been closed (${new Date()})`);
            });

        } else {
          console.log(`Message malformed:`);
          console.log(msg);
          return;
        }

      } catch (err) {
        console.log(err);
        return;
      }
    }

    let data = await readBytes(downloadSessions[session].rs, downloadSessions[session].chunkSize);
    let lastIndex = downloadSessions[session].lastIndex;
    let index = ++downloadSessions[session].index;

    socket.emit('downloaded_encrypted_chunk', { filename: msg.filename, uuid: msg.uuid, data: data, filetype: msg.filetype, index, lastIndex });
  }
}


export default {
  uploadEncryptedChunkHandler,
  downloadEncryptedChunkHandler
}