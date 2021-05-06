import listDir from './listDir';
import { isDocumentArchive } from './util';
import FileStorage from './../storage';
// these extensions are considered to have text content
const TEXTISH = ['txt', 'html', 'xml', 'json']

/*
  Provides a list of records found in an archive folder.

  @param {object} opts
    - `noBinaryData`: do not load the content of binary files
    - `ignoreDotFiles`: ignore dot-files
    - versioning: set to true if versioning should be enabled
*/
module.exports = async function readArchive(archiveDir, opts = {}) {
  // make sure that the given path is a dar
  const isArchive = await isDocumentArchive(archiveDir);
  if (isArchive) {
    // first get a list of stats
    const entries = await listDir(archiveDir, opts)
    // then get file records as specified TODO:link
    let resources = {}
    for (var i = 0; i < entries.length; i++) {
      let entry = entries[i]
      let record = await _getFileRecord(entry, opts)
      resources[record.path] = record
    }
    return {
      resources,
      version: "0"
    }
  } else {
    throw new Error(archiveDir + ' is not a valid document archive.')
  }
}


/*
  Provides a record for a file as it is used for the DocumentArchive persistence protocol.

  Binary files can be exluced using `opts.noBinaryData`.

  @example

  ```
  {
    id: 'manuscript.xml',
    encoding: 'utf8',
    data: '<article>....</article>',
    size: 5782,
    createdAt: 123098123098,
    updatedAt: 123234567890,
  }
  ```
*/
async function _getFileRecord(fileEntry, opts) {
  // for text files load content
  // for binaries use a url

  let record = {
    path: fileEntry.name,
    encoding: null,
    size: fileEntry.size,
    createdAt: fileEntry.modifyTime || fileEntry.birthtime.getTime(),
    updatedAt: fileEntry.modifyTime || fileEntry.mtime.getTime()
  }

  if (_isTextFile(fileEntry.name)) {
    return new Promise(async (resolve, reject) => {
      try {
        const buff = await FileStorage.get(fileEntry.path, undefined, { encoding: "utf8" });
        record.encoding = 'utf8';
        record.data = buff.toString('utf8');
        resolve(record);
      } catch(err) {
        console.error(err);
        reject(err);
      }
    })

  } else {
    // used internally only
    record._binary = true;
    if (opts.noBinaryContent) {
      return Promise.resolve(record)
    } else {
      return new Promise(async (resolve, reject) => {
        try {
          const buff = await FileStorage.get(fileEntry.path, undefined, { encoding: "hex" });
          record.encoding = 'hex';
          record.data = buff.toString('hex');
          resolve(record);
        } catch (err) {
          console.error(err);
          reject(err);
        }
      })
    }
  }
}

function _isTextFile(f) {
  return new RegExp(`\\.(${TEXTISH.join('|')})$`).exec(f)
}
