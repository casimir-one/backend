import multer from 'koa-multer';
import fs from 'fs';
import util from 'util';
import path from 'path';
import * as authService from './../services/auth';
import templatesService from './../services/templateRef';
import filesUtil from './../utils/files';
import fsExtra from "fs-extra";
import uuidv4 from "uuid/v4";
import send from 'koa-send';

const MAX_FILENAME_LENGTH = 200;

const getDocumentTemplateRef = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const refId = ctx.params.refId;

  const templateRef = await templatesService.findTemplateRefById(refId);
  if (!templateRef) {
    ctx.status = 404;
    ctx.body = `Template ${refId} is not found`;
    return;
  }

  const authorized = await authService.authorizeResearchGroup(templateRef.organizationId, jwtUsername);
  if (!authorized) {
    ctx.status = 401;
    ctx.body = `"${jwtUsername}" is not a member of "${templateRef.organizationId}" group`;
    return;
  }

  ctx.status = 200;
  ctx.body = templateRef;
}

const getDocumentTemplatesRefsByOrganization = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const organizationId = ctx.params.organizationId;

  const authorized = await authService.authorizeResearchGroup(organizationId, jwtUsername);
  if (!authorized) {
    ctx.status = 401;
    ctx.body = `"${jwtUsername}" is not a member of "${organizationId}" group`
    return;
  }

  const templatesRefs = await templatesService.findTemplateRefByOrganizationId(organizationId);

  ctx.status = 200;
  ctx.body = templatesRefs;
}

const filesStoragePath = path.join(__dirname, './../files');
const templatesStoragePath = (orgId) => `${filesStoragePath}/templates/${orgId}`;
const templatePath = (orgId, filename) => `${templatesStoragePath(orgId)}/${filename}`;

const allowedTemplateMimeTypes = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/msword'
];

const templatesStorage = multer.diskStorage({
  destination: async function (req, file, callback) {
    const orgId = req.headers['organization-id'];
    const dest = templatesStoragePath(orgId);
    const ensureDir = util.promisify(fsExtra.ensureDir);
    await ensureDir(dest);
    callback(null, dest);
  },
  filename: function (req, file, callback) {
    const uuid = uuidv4();
    if (file.originalname.length > MAX_FILENAME_LENGTH) {
      callback(new Error(`Filename length must not exceed ${MAX_FILENAME_LENGTH} characters`));
      return;
    }
    callback(null, `${uuid}_${file.originalname}`);
  }
});

const templatesUploader = multer({
  storage: templatesStorage,
  fileFilter: function (req, file, callback) {
    if (allowedTemplateMimeTypes.find(mime => mime === file.mimetype) === undefined) {
      return callback(new Error('Only the following mime types are allowed: ' + allowedTemplateMimeTypes.join(', ')), false);
    }
    callback(null, true);
  }
})

const uploadTemplate = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const organizationId = ctx.request.header['organization-id'];
  const templateTitle = ctx.request.header['template-title'];

  try {

    if (organizationId == null || templateTitle == null) {
      ctx.status = 404;
      ctx.body = `"Organization-Id", "Template-Title" headers are required`;
      return;
    }

    const authorized = await authService.authorizeResearchGroup(organizationId, jwtUsername);
    if (!authorized) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not a member of "${organizationId}" group`;
      return;
    }

    const templateDoc = templatesUploader.single('templateFile');
    const result = await templateDoc(ctx, () => new Promise((resolve) => {
      resolve({
        'filename': ctx.req.file.filename,
        'path': ctx.req.file.path,
        'mimetype': ctx.req.file.mimetype,
        'size': ctx.req.file.size
      });
    }));

    const filepath = path.relative(process.cwd(), result.path);
    let previewFilepath = filepath;

    if (result.mimetype == 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' ||
        result.mimetype == 'application/msword') {

      previewFilepath = await filesUtil.docxToPdf(filepath);;
    }
    const hash = await filesUtil.sha256(filepath);

    const templateRef = await templatesService.createTemplateRef({
      title: templateTitle,
      organizationId: organizationId,
      originalname: result.filename.substring(result.filename.indexOf('_') + 1, result.filename.length),
      filename: result.filename,
      filetype: result.mimetype,
      filepath: filepath,
      previewFilepath: previewFilepath,
      size: result.size,
      hash: hash,
      uploader: jwtUsername
    });

    ctx.status = 200;
    ctx.body = templateRef;

  } catch (err) {
    console.log(err);
    ctx.status = 500
    ctx.body = `Internal server error, please try again later`;
  }
}

const removeTemplate = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const refId = ctx.params.refId;

  try {

    const templateRef = await templatesService.findTemplateRefById(refId);
    if (!templateRef) {
      ctx.status = 404;
      ctx.body = `Template ${refId} is not found`;
      return;
    }

    const authorized = await authService.authorizeResearchGroup(templateRef.organizationId, jwtUsername);
    if (!authorized) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not a member of "${templateRef.organizationId}" group`;
      return;
    }
    
    await templatesService.removeTemplateRef(refId);
    try {
      const unlinkAsync = util.promisify(fs.unlink);
      // consider to not remove the template if there is existing NDA
      await unlinkAsync(templateRef.filepath);
      if (templateRef.filepath != templateRef.previewFilepath) {
        await unlinkAsync(templateRef.previewFilepath);
      }
    } catch (err) { console.log(err); }

    ctx.status = 201;
    ctx.body = templateRef._id;

  } catch (err) {
    console.log(err);
    ctx.status = 500
    ctx.body = `Internal server error, please try again later`;
  }
}

const getDocumentTemplateFile = async function (ctx) {
  const jwtUsername = ctx.state.user.username;
  const refId = ctx.params.refId;
  const isDownload = ctx.query.download;

  const templateRef = await templatesService.findTemplateRefById(refId);
  if (!templateRef) {
    ctx.status = 404;
    ctx.body = `Template ${refId} is not found`;
    return;
  }

  const authorized = await authService.authorizeResearchGroup(templateRef.organizationId, jwtUsername);
  if (!authorized) {
    ctx.status = 401;
    ctx.body = `"${jwtUsername}" is not a member of "${templateRef.organizationId}" group`;
    return;
  }

  if (isDownload) {
    ctx.response.set('Content-disposition', 'attachment; filename="' + templateRef.originalname + '"');
    ctx.body = fs.createReadStream(templateRef.filepath);
  } else {
    await send(ctx, templateRef.previewFilepath);
  }
}



export default {
  getDocumentTemplateRef,
  getDocumentTemplatesRefsByOrganization,
  uploadTemplate,
  removeTemplate,
  getDocumentTemplateFile
}