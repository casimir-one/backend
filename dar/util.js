import path from 'path';
import fs from 'fs';
import util from 'util';
import FileStorage from './../storage';

const stat = util.promisify(fs.stat);

async function isDocumentArchive(archiveDir, forceLocal) {
  // assuming it is a DAR if the folder exists and there is a manifest.xml
  const p = path.join(archiveDir, 'manifest.xml');
  const result = await _fileExists(p, forceLocal);
  return result;
}

async function _fileExists(path, forceLocal) {
  if (forceLocal) {
    try {
      await stat(path);
      return true;
    } catch (err) {
      return false;
    }
  } else {
    const exists = await FileStorage.exists(path);
    return exists;
  }

}


module.exports = {
  isDocumentArchive
}
