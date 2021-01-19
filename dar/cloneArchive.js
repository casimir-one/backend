import { isDocumentArchive } from './util';
import FileStorage from './../storage';

module.exports = async function cloneArchive(archiveDir, newArchiveDir, forceLocal) {
  // make sure that the given path is a dar
  const exists = await isDocumentArchive(archiveDir, forceLocal);
  if (exists) {
    await FileStorage.uploadDir(archiveDir, newArchiveDir);
    return true;
  } else {
    throw new Error(archiveDir + ' is not a valid document archive.')
  }
}
