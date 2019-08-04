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

async function findFileRefByProject(projectId) {
  const fileRefs = await FileRef.find({ projectId });
  return fileRefs;
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
  creator,
  uploader,
  certifier,
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
    creator: creator,
    uploader: uploader,
    certifier: certifier,
    status: status
  });
  const savedRef = await fileRef.save();
  return savedRef;
}

async function upsertTimestampedFilesRefs(files, username) {
  if (!files || !files.length || files.some(f => !f.hash) || files.some(f => !f.permlink) || !username)
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
      size: size,
      hash: hash,
      permlink: permlink,
      creator: username,
      certifier: username
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
  permlink,
  creator,
  certifier
}) {

  if (!hash || !permlink || !certifier)
    throw Error("Required fields are not provided for 'timestamped' status");

  const fileRef = await findFileRefByHash(projectId, hash);

  if (fileRef) {
    if (fileRef.status == "uploaded") {
      fileRef.certifier = certifier;
      fileRef.permlink = permlink;
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
    creator: creator,
    uploader: null,
    certifier: certifier,
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
  accessKeys,
  creator,
  uploader
}) {

  if (!hash || !iv || !chunkSize || !filepath || !uploader || !accessKeys || !accessKeys.length) 
    throw Error("Required fields are not provided for 'uploaded' status");

  const fileRef = await findFileRefByHash(projectId, hash);

  if (fileRef) {
    if (fileRef.status == "timestamped") {
      fileRef.iv = iv;
      fileRef.chunkSize = chunkSize;
      fileRef.filepath = filepath;
      fileRef.accessKeys = accessKeys;
      fileRef.uploader = uploader;
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
    permlink: null,
    accessKeys,
    creator: creator,
    uploader: uploader,
    certifier: null,
    status: "uploaded" });

  return uploadedFileRef;
}

export default {
  findFileRefById,
  findFileRefByHash,
  findFileRefByProject,
  upsertTimestampedFileRef,
  upsertUploadedFileRef,
  upsertTimestampedFilesRefs
}