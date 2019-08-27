import deipRpc from '@deip/deip-rpc-client';
import TemplateRef from './../schemas/templateRef';

async function findTemplateRefById(_id) {
  const templateRef = await TemplateRef.findOne({ _id });
  return templateRef;
}

async function findTemplateRefByOrganizationId(organizationId) {
  const templateRefs = await TemplateRef.find({ organizationId });
  return templateRefs;
}

async function linkContractRefToTemplateRef(templateRefId, contractRefId) {
  const templateRef = await findTemplateRefById(templateRefId);
  templateRef.contracts.push({ _id: contractRefId});
  const updatedRef = await templateRef.save();
  return updatedRef;
}

async function createTemplateRef({
  title,
  organizationId,
  originalname,
  filename,
  filetype,
  filepath,
  previewFilepath,
  size,
  hash,
  uploader
}) {

  const templateRef = new TemplateRef({
    title: title,
    organizationId: organizationId,
    originalname: originalname,
    filename: filename,
    filetype: filetype,
    filepath: filepath,
    previewFilepath: previewFilepath,
    size: size,
    hash: hash,
    uploader: uploader
  });
  const savedRef = await templateRef.save();
  return savedRef;
}

async function removeTemplateRef(_id) {
  await TemplateRef.deleteOne({ _id });
}


export default {
  findTemplateRefById,
  findTemplateRefByOrganizationId,
  linkContractRefToTemplateRef,
  createTemplateRef,
  removeTemplateRef
}