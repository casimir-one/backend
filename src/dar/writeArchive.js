import path from 'path';
import FileStorage from './../storage';

/*
  TODO: Implement versioning backed by Git
        - Check if rawArchive.version === latest Git sha
        - After saving `git add` all changed files and `git commit` them
        - Return new sha (newVersion) to client
*/
module.exports = async function writeArchive(archiveDir, rawArchive, opts = {}) {
  let resourceNames = Object.keys(rawArchive.resources)
  let newVersion = "0"
  
  if (opts.versioning) {
    console.warn('WARNING: Git based versioning is not yet implemented.')
  }

  return Promise.all(resourceNames.map(f => {
    let record = rawArchive.resources[f]
    switch(record.encoding) {
      case 'utf8': {
        return _writeFile(path.join(archiveDir, f), record.data, 'utf8')
      }
      case 'blob': {
        return _writeFile(path.join(archiveDir, f), record.data)
      }
      // TODO: are there other encodings which we want to support?
      default:
        return false
    }
  })).then(() => {
    return newVersion
  })
}

function _writeFile(p, data, encoding) {
  return new Promise(async (resolve, reject) => {
    const opts = encoding ? { encoding } : {};
    if (typeof data.pipe === 'function') {
      await FileStorage.putPassThroughStream(p, data, opts);
      resolve();
    } else {
      const buff = encoding ? Buffer.from(data, encoding) : Buffer.from(data);
      try {
        await FileStorage.put(p, buff, opts);
        resolve();
      } catch (err) {
        console.error(err);
        reject(err);
      }
    }
  })
}
