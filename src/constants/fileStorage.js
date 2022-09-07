import { createEnum } from '@casimir.one/toolbox';

const FILE_STORAGE = createEnum({
  LOCAL_FILESYSTEM: 1,
  REMOTE_SFTP: 2,
});


export default FILE_STORAGE;