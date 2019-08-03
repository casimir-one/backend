import deipRpc from '@deip/deip-rpc-client';
import FileRef from './../schemas/fileRef';

async function findFileRefById(_id) {
  const fileRef = await FileRef.findOne({ _id });
  return fileRef;
}

async function findFileRefByHash(projectId, hash) {
  const fileRef = await FileRef.findOne({ projectId, hash });
  return fileRef;
}

async function createFileRef({
  organizationId,
  projectId,
  filename,
  filetype,
  filepath,
  size,
  hash,
  iv,
  chunkSize,
  permlink,
  accessKeys,
  status 
}) {

  const fileRef = new FileRef({
    organizationId: organizationId,
    projectId: projectId,
    filename: filename,
    filetype: filetype,
    filepath: filepath,
    size: size,
    hash: hash,
    iv: iv,
    chunkSize: chunkSize,
    permlink: permlink,
    accessKeys: accessKeys,
    status: status,
  });
  const savedRef = await fileRef.save();
  return savedRef;
}

async function upsertTimestampedFilesRefs(files) {
  if (!files || !files.length || files.some(f => !f.hash))
    throw Error("Required fields are not provided for 'timestamped' status");

  const promises = [];
  for (let i = 0; i < files.length; i++) {
    let file = files[i];
    let { organizationId, projectId, filename, filetype, size, hash, permlink } = file;

    let promise = await upsertTimestampedFileRef({
      organizationId: organizationId,
      projectId: projectId,
      filename: filename,
      filetype: filetype,
      filepath: null,
      size: size,
      hash: hash,
      iv: null,
      chunkSize: null,
      permlink: permlink,
      accessKeys: [],
      status: "timestamped",
    });
    promises.push(promise);
  }

  let savedRefs = await Promise.all(promises);
  return savedRefs;
}

async function upsertTimestampedFileRef({
  organizationId,
  projectId,
  filename,
  filetype,
  size,
  hash,
  permlink 
}) {

  if (!hash)
    throw Error("Required fields are not provided for 'timestamped' status");

  const fileRef = await findFileRefByHash(projectId, hash);

  if (fileRef) {
    if (fileRef.status == "uploaded") {
      fileRef.status = "uploaded_and_timestamped";
      let timestampedFileRef = await fileRef.save();
      return timestampedFileRef;
    } else {
      return fileRef;
    }
  }

  let timestampedFileRef = await createFileRef({
    organizationId,
    projectId,
    filename,
    filetype,
    filepath: null,
    size,
    hash,
    iv: null,
    chunkSize: null,
    permlink,
    accessKeys: [],
    status: "timestamped"
  });

  return timestampedFileRef;
}

async function upsertUploadedFileRef({
  organizationId,
  projectId,
  filename,
  filetype,
  filepath,
  size,
  hash,
  iv,
  chunkSize,
  permlink,
  accessKeys 
}) {

  if (!hash || !iv || !chunkSize || !filepath || !accessKeys || !accessKeys.length) 
    throw Error("Required fields are not provided for 'uploaded' status");

  const fileRef = await findFileRefByHash(projectId, hash);

  if (fileRef) {
    if (fileRef.status == "timestamped") {
      fileRef.iv = iv;
      fileRef.chunkSize = chunkSize;
      fileRef.filepath = filepath;
      fileRef.accessKeys = accessKeys;
      fileRef.status = "uploaded_and_timestamped";
      let uploadedFileRef = await fileRef.save();
      return uploadedFileRef;
    } else {
      return fileRef;
    }
  }

  let uploadedFileRef = await createFileRef({
    organizationId,
    projectId,
    filename,
    filetype,
    filepath,
    size,
    hash,
    iv,
    chunkSize,
    permlink,
    accessKeys,
    status: "uploaded" });

  return uploadedFileRef;
}

export default {
  findFileRefById,
  findFileRefByHash,
  upsertTimestampedFileRef,
  upsertUploadedFileRef,
  upsertTimestampedFilesRefs
}