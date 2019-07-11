import deipRpc from '@deip/deip-rpc-client';
import FileRef from './../schemas/fileRef';

export async function findFileRefById(_id) {
  const fr = await FileRef.findOne({ _id });
  return fr;
}

export async function findFileRefByHash(projectId, hash) {
  const fr = await FileRef.findOne({ projectId, hash });
  return fr;
}


export async function createFileRef(organizationId, projectId, filename, filetype, filepath, size, hash, iv, chunkSize, accessKeys, status) {
  const fr = new FileRef({
    organizationId: organizationId,
    projectId: projectId,
    filename: filename,
    filetype: filetype,
    filepath: filepath,
    size: size,
    hash: hash,
    iv: iv,
    chunkSize: chunkSize,
    accessKeys: accessKeys,
    status: status,
  });
  const savedRef = await fr.save();
  return savedRef;
}
