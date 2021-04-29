import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import sharp from 'sharp'
import send from 'koa-send';
import slug from 'limax';
import qs from 'qs';
import deipRpc from '@deip/rpc-client';
import ProjectDtoService from './../../services/impl/read/ProjectDtoService';
import ProjectService from './../../services/impl/write/ProjectService';
import ResearchApplicationService from './../../services/legacy/researchApplication';
import * as blockchainService from './../../utils/blockchain';
import { LEGACY_APP_EVENTS, RESEARCH_APPLICATION_STATUS, ATTRIBUTE_TYPE, RESEARCH_STATUS, ATTRIBUTE_SCOPE } from './../../constants';
import FileStorage from './../../storage';
import { researchApplicationForm, researchApplicationAttachmentFilePath } from './../../forms/legacy/researchApplicationForms';
import ResearchGroupCreatedEvent from './../../events/legacy/researchGroupCreatedEvent';


const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const ensureDir = util.promisify(fsExtra.ensureDir);


const createResearch = async (ctx, next) => {
  ctx.status = 200;
  ctx.body = "This resource is deprecated, use v2 endpoint";
};


const updateResearch = async (ctx, next) => {
  ctx.status = 200;
  ctx.body = "This resource is deprecated, use v2 endpoint";
};



const createResearchApplication = async (ctx, next) => {
    // DEPRECATED
  const jwtUsername = ctx.state.user.username;

  try {

    const researchApplicationService = new ResearchApplicationService();

    const formUploader = researchApplicationForm.fields([
      { name: 'budgetAttachment', maxCount: 1 },
      { name: 'businessPlanAttachment', maxCount: 1 },
      { name: 'cvAttachment', maxCount: 1 }, 
      { name: 'marketResearchAttachment', maxCount: 1 }
    ]);

    const form = await formUploader(ctx, () => new Promise((resolve, reject) => {
      const [budgetAttachment] = ctx.req.files.budgetAttachment ? ctx.req.files.budgetAttachment : [null];
      const [businessPlanAttachment] = ctx.req.files.businessPlanAttachment ? ctx.req.files.businessPlanAttachment : [null];
      const [cvAttachment] = ctx.req.files.cvAttachment ? ctx.req.files.cvAttachment : [null];
      const [marketResearchAttachment] = ctx.req.files.marketResearchAttachment ? ctx.req.files.marketResearchAttachment : [null];

      resolve({
        budgetAttachment: budgetAttachment ? budgetAttachment.filename : null,
        businessPlanAttachment: businessPlanAttachment ? businessPlanAttachment.filename : null,
        cvAttachment: cvAttachment ? cvAttachment.filename : null, 
        marketResearchAttachment: marketResearchAttachment ? marketResearchAttachment.filename : null, 

        ...ctx.req.body,
        location: JSON.parse(ctx.req.body.location),
        researchDisciplines: JSON.parse(ctx.req.body.researchDisciplines),
        attributes: JSON.parse(ctx.req.body.attributes),
        tx: JSON.parse(ctx.req.body.tx)
      });
    }));

    const txResult = await blockchainService.sendTransactionAsync(form.tx);
    const datums = blockchainService.extractOperations(form.tx);
    const proposal = await deipRpc.api.getProposalAsync(form.proposalId);
    const isAccepted = proposal == null;

    const researchApplicationRm = await researchApplicationService.createResearchApplication({
      proposalId: form.proposalId,
      researchExternalId: form.researchExternalId,
      researcher: form.researcher,
      title: form.researchTitle,
      status: !isAccepted ? RESEARCH_APPLICATION_STATUS.PENDING : RESEARCH_APPLICATION_STATUS.APPROVED,
      description: form.description,
      disciplines: form.researchDisciplines,
      location: form.location,
      problem: form.problem,
      solution: form.solution,
      attributes: form.attributes,
      funding: form.funding,
      eta: form.eta,
      budgetAttachment: form.budgetAttachment,
      businessPlanAttachment: form.businessPlanAttachment,
      cvAttachment: form.cvAttachment,
      marketResearchAttachment: form.marketResearchAttachment,
      tx: form.tx
    });

    const researchApplication = researchApplicationRm;

    ctx.status = 200;
    ctx.body = { txResult, tx: form.tx, rm: researchApplication };

    if (!isAccepted) {
      ctx.state.events.push([LEGACY_APP_EVENTS.RESEARCH_APPLICATION_CREATED, { tx: form.tx, emitter: jwtUsername }]);
    } else {
      // TODO: emit research created event
    }

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
};


const editResearchApplication = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const applicationId = ctx.params.proposalId;

  try {

    const researchApplicationService = new ResearchApplicationService();

    const researchApplication = await researchApplicationService.getResearchApplication(applicationId);
    if (!researchApplication) {
      ctx.status = 404;
      ctx.body = `Research application "${applicationId}" is not found`;
      return;
    }

    if (researchApplication.status != RESEARCH_APPLICATION_STATUS.PENDING) {
      ctx.status = 400;
      ctx.body = `Research application "${applicationId}" status is ${researchApplication.status}`;
      return;
    }

    const formUploader = researchApplicationForm.fields([
      { name: 'budgetAttachment', maxCount: 1 },
      { name: 'businessPlanAttachment', maxCount: 1 },
      { name: 'cvAttachment', maxCount: 1 },
      { name: 'marketResearchAttachment', maxCount: 1 }
    ]);

    const form = await formUploader(ctx, () => new Promise((resolve, reject) => {
      const [budgetAttachment] = ctx.req.files.budgetAttachment ? ctx.req.files.budgetAttachment : [null];
      const [businessPlanAttachment] = ctx.req.files.businessPlanAttachment ? ctx.req.files.businessPlanAttachment : [null];
      const [cvAttachment] = ctx.req.files.cvAttachment ? ctx.req.files.cvAttachment : [null];
      const [marketResearchAttachment] = ctx.req.files.marketResearchAttachment ? ctx.req.files.marketResearchAttachment : [null];

      resolve({
        budgetAttachment: budgetAttachment ? budgetAttachment.filename : null,
        businessPlanAttachment: businessPlanAttachment ? businessPlanAttachment.filename : null,
        cvAttachment: cvAttachment ? cvAttachment.filename : null,
        marketResearchAttachment: marketResearchAttachment ? marketResearchAttachment.filename : null,

        ...ctx.req.body,
        location: JSON.parse(ctx.req.body.location),
        attributes: JSON.parse(ctx.req.body.attributes)
      });
    }));

    const update = {
      ...form,
      budgetAttachment: form.budgetAttachment ? form.budgetAttachment : researchApplication.budgetAttachment,
      businessPlanAttachment: form.businessPlanAttachment ? form.businessPlanAttachment : researchApplication.businessPlanAttachment,
      cvAttachment: form.cvAttachment ? form.cvAttachment : researchApplication.cvAttachment,
      marketResearchAttachment: form.marketResearchAttachment ? form.marketResearchAttachment : researchApplication.marketResearchAttachment
    }

    try {
      if (researchApplication.budgetAttachment != update.budgetAttachment) {
        await unlink(researchApplicationAttachmentFilePath(applicationId, researchApplication.budgetAttachment));
      }
      if (researchApplication.businessPlanAttachment != update.businessPlanAttachment) {
        await unlink(researchApplicationAttachmentFilePath(applicationId, researchApplication.businessPlanAttachment));
      }
      if (researchApplication.cvAttachment != update.cvAttachment) {
        await unlink(researchApplicationAttachmentFilePath(applicationId, researchApplication.cvAttachment));
      }
      if (researchApplication.marketResearchAttachment != update.marketResearchAttachment) {
        await unlink(researchApplicationAttachmentFilePath(applicationId, researchApplication.marketResearchAttachment));
      }
    } catch(err){}


    const researchApplicationData = researchApplication;
    const updatedResearchApplication = await researchApplicationService.updateResearchApplication(applicationId, {
      ...researchApplicationData,
      ...update
    });

    ctx.status = 200;
    ctx.body = { rm: updatedResearchApplication };

    ctx.state.events.push([LEGACY_APP_EVENTS.RESEARCH_APPLICATION_EDITED, { tx: researchApplicationData.tx, emitter: jwtUsername }]);

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
};


const getResearchApplicationAttachmentFile = async function (ctx) {
  const jwtUsername = ctx.state.user.username;
  const applicationId = ctx.params.proposalId;
  const filename = ctx.query.filename;
  const isDownload = ctx.query.download === 'true';

  try {

    if (!filename) {
      ctx.status = 400;
      ctx.body = `"filename" query param is required`;
      return;
    }

    const researchApplicationService = new ResearchApplicationService();
    const researchApplication = await researchApplicationService.getResearchApplication(applicationId);
    if (!researchApplication) {
      ctx.status = 404;
      ctx.body = `Research application "${applicationId}" is not found`;
      return;
    }

    const filepath = researchApplicationAttachmentFilePath(applicationId, filename);

    try {
      await stat(filepath);
    } catch (err) {
      ctx.status = 404;
      ctx.body = `File "${filename}" is not found`;
      return;
    }

    if (isDownload) {
      let ext = filename.substr(filename.lastIndexOf('.') + 1);
      let name = filename.substr(0, filename.lastIndexOf('.'));
      ctx.response.set('Content-disposition', `attachment; filename="${slug(name)}.${ext}"`);
      ctx.body = fs.createReadStream(filepath);
    } else {
      await send(ctx, filepath, { root: '/' });
    }

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const approveResearchApplication = async (ctx, next) => {
  // DEPRECATED
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try { 

    const researchApplicationService = new ResearchApplicationService();

    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: applicationId } = payload;

    const researchApplication = await researchApplicationService.getResearchApplication(applicationId);
    if (!researchApplication) {
      ctx.status = 404;
      ctx.body = `Research application "${applicationId}" is not found`;
      return;
    }

    if (researchApplication.status != RESEARCH_APPLICATION_STATUS.PENDING) {
      ctx.status = 400;
      ctx.body = `Research application "${applicationId}" status is ${researchApplication.status}`;
      return;
    }

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    const updatedProposal = await deipRpc.api.getProposalAsync(applicationId);
    const isAccepted = updatedProposal == null;

    const researchGroupCreatedEvent = new ResearchGroupCreatedEvent(datums, { name: "", description: "" });
    ctx.state.events.push(researchGroupCreatedEvent);

    // TODO: Emit 'project created' event

    const researchApplicationData = researchApplication;
    const updatedResearchApplication = await researchApplicationService.updateResearchApplication(applicationId, {
      ...researchApplicationData,
      status: RESEARCH_APPLICATION_STATUS.APPROVED
    });
    
    ctx.status = 200;
    ctx.body = { tx, txResult };

    if (isAccepted) {
      ctx.state.events.push([LEGACY_APP_EVENTS.RESEARCH_APPLICATION_APPROVED, { tx: researchApplicationData.tx, emitter: jwtUsername }]);
    }
    
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const rejectResearchApplication = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try { 

    const researchApplicationService = new ResearchApplicationService();

    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: applicationId } = payload;

    const researchApplication = await researchApplicationService.getResearchApplication(applicationId);
    if (!researchApplication) {
      ctx.status = 404;
      ctx.body = `Research application "${applicationId}" is not found`;
      return;
    }

    if (researchApplication.status != RESEARCH_APPLICATION_STATUS.PENDING) {
      ctx.status = 400;
      ctx.body = `Research application "${applicationId}" status is ${researchApplication.status}`;
      return;
    }

    const txResult = await blockchainService.sendTransactionAsync(tx);

    const researchApplicationData = researchApplication;
    const updatedResearchApplication = await researchApplicationService.updateResearchApplication(applicationId, {
      ...researchApplicationData,
      status: RESEARCH_APPLICATION_STATUS.REJECTED
    });

    ctx.status = 200;
    ctx.body = { tx, txResult };

    ctx.state.events.push([LEGACY_APP_EVENTS.RESEARCH_APPLICATION_REJECTED, { tx: researchApplicationData.tx, emitter: jwtUsername }]);
    
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const deleteResearchApplication = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try {

    const researchApplicationService = new ResearchApplicationService();

    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: applicationId } = payload;


    const researchApplication = await researchApplicationService.getResearchApplication(applicationId);
    if (!researchApplication) {
      ctx.status = 404;
      ctx.body = `Research application "${applicationId}" is not found`;
      return;
    }

    if (researchApplication.status != RESEARCH_APPLICATION_STATUS.PENDING) {
      ctx.status = 400;
      ctx.body = `Research application "${applicationId}" status is ${researchApplication.status}`;
      return;
    }

    if (researchApplication.researcher != jwtUsername) {
      ctx.status = 401;
      ctx.body = `No access to research application "${applicationId}"`;
      return;
    }
    

    const txResult = await blockchainService.sendTransactionAsync(tx);

    const researchApplicationData = researchApplication;
    const updatedResearchApplication = await researchApplicationService.updateResearchApplication(applicationId, {
      ...researchApplicationData,
      status: RESEARCH_APPLICATION_STATUS.DELETED
    });

    ctx.status = 200;
    ctx.body = { tx, txResult };

    ctx.state.events.push([LEGACY_APP_EVENTS.RESEARCH_APPLICATION_DELETED, { tx: researchApplicationData.tx, emitter: jwtUsername }]);
    
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const getResearchApplications = async (ctx) => {
  const status = ctx.query.status;
  const researcher = ctx.query.researcher;

  try {

    const researchApplicationService = new ResearchApplicationService();
    const result = await researchApplicationService.getResearchApplications({ status, researcher });
    ctx.status = 200;
    ctx.body = result;
    
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchAttributeFile = async (ctx) => {
  const researchExternalId = ctx.params.researchExternalId;
  const attributeId = ctx.params.attributeId;
  const filename = ctx.params.filename;

  const isResearchRootFolder = researchExternalId == attributeId;
  const filepath = isResearchRootFolder ? FileStorage.getResearchFilePath(researchExternalId, filename) : FileStorage.getResearchAttributeFilePath(researchExternalId, attributeId, filename);
  
  const fileExists = await FileStorage.exists(filepath);
  if (!fileExists) {
    ctx.status = 404;
    ctx.body = `${filepath} is not found`;
    return;
  }

  const buff = await FileStorage.get(filepath);

  try {

    const imageQuery = ctx.query.image === 'true';
    if (imageQuery) {

      const width = ctx.query.width ? parseInt(ctx.query.width) : 1440;
      const height = ctx.query.height ? parseInt(ctx.query.height) : 430;
      const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
      const isRound = ctx.query.round ? ctx.query.round === 'true' : false;

      const resize = (w, h) => {
        return new Promise((resolve) => {
          sharp.cache(!noCache);
          sharp(buff)
            .rotate()
            .resize(w, h)
            .png()
            .toBuffer()
            .then(data => {
              resolve(data)
            })
            .catch(err => {
              resolve(err)
            });
        })
      }

      let image = await resize(width, height);
      if (isRound) {
        let round = (w) => {
          let r = w / 2;
          let circleShape = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);
          return new Promise((resolve, reject) => {
            image = sharp(image)
              .overlayWith(circleShape, { cutout: true })
              .png()
              .toBuffer()
              .then(data => {
                resolve(data)
              })
              .catch(err => {
                reject(err)
              });
          });
        }

        image = await round(width);
      }

      ctx.type = 'image/png';
      ctx.status = 200;
      ctx.body = image;

    } else {

      const isDownload = ctx.query.download === 'true';

      const ext = filename.substr(filename.lastIndexOf('.') + 1);
      const name = filename.substr(0, filename.lastIndexOf('.'));
      const isImage = ['png', 'jpeg', 'jpg'].some(e => e == ext);
      const isPdf = ['pdf'].some(e => e == ext);

      if (isDownload) {
        ctx.response.set('Content-Disposition', `attachment; filename="${slug(name)}.${ext}"`);
        ctx.body = buff;
      } else if (isImage) {
        ctx.response.set('Content-Type', `image/${ext}`);
        ctx.response.set('Content-Disposition', `inline; filename="${slug(name)}.${ext}"`);
        ctx.body = buff;
      } else if (isPdf) {
        ctx.response.set('Content-Type', `application/${ext}`);
        ctx.response.set('Content-Disposition', `inline; filename="${slug(name)}.${ext}"`);
        ctx.body = buff;
      } else {
        ctx.response.set('Content-Disposition', `attachment; filename="${slug(name)}.${ext}"`);
        ctx.body = buff;
      }
    }

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}

const getPublicResearchListing = async (ctx) => {
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  try {
    const projectDtoService = new ProjectDtoService();
    const result = await projectDtoService.lookupResearches(filter);
    ctx.status = 200;
    ctx.body = result.filter(r => !r.isPrivate);
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
};


const getUserResearchListing = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const member = ctx.params.username;

  const projectDtoService = new ProjectDtoService();
  try {
    const result = await projectDtoService.getResearchesForMember(member)
    ctx.status = 200;
    ctx.body = result.filter(r => !r.isPrivate || r.members.some(m => m == jwtUsername));

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
};


const getResearchGroupResearchListing = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const researchGroupExternalId = ctx.params.researchGroupExternalId;

  try {
    const projectDtoService = new ProjectDtoService();
    const result = await projectDtoService.getResearchesByResearchGroup(researchGroupExternalId);
    ctx.status = 200;
    ctx.body = result.filter(r => !r.isPrivate || r.members.some(m => m == jwtUsername));

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
};


const getResearch = async (ctx) => {
  const researchExternalId = ctx.params.researchExternalId;

  try {
    const projectDtoService = new ProjectDtoService();
    const research = await projectDtoService.getResearch(researchExternalId);
    if (!research) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
   
    ctx.status = 200;
    ctx.body = research;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
};


const getResearches = async (ctx) => {
  const query = qs.parse(ctx.query);
  const researchesExternalIds = query.researches;

  try {

    if (!Array.isArray(researchesExternalIds)) {
      ctx.status = 400;
      ctx.body = `Bad request (${JSON.stringify(query)})`;
      return;
    }

    const projectDtoService = new ProjectDtoService();
    const researches = await projectDtoService.getResearches(researchesExternalIds);

    const result = researches;
    ctx.status = 200;
    ctx.body = result;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
};


const getTenantResearchListing = async (ctx) => {
  const tenantId = ctx.params.tenantId;

  try {
    const projectDtoService = new ProjectDtoService();
    const result = await projectDtoService.getResearchesByTenant(tenantId);
    ctx.status = 200;
    ctx.body = result.filter(r => !r.isPrivate);

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
};


const deleteResearch = async (ctx) => {
  const tenantId = ctx.state.tenant.id;
  const researchExternalId = ctx.params.researchExternalId;
  const jwtUsername = ctx.state.user.username;
  const isTenantAdmin = ctx.state.isTenantAdmin;

  try {

    const projectDtoService = new ProjectDtoService();
    const projectService = new ProjectService();
    const research = await projectDtoService.getResearch(researchExternalId);

    if (!research) {
      ctx.status = 404;
      ctx.body = `Research '${researchExternalId}' does not exist`;
      return;
    }

    if (!isTenantAdmin || research.tenantId != tenantId) {
      ctx.status = 401;
      ctx.body = `"${jwtUsername}" is not permitted to delete "${researchExternalId}" research`;
      return;
    }

    const updatedResearch = await projectService.updateProject(researchExternalId, { status: RESEARCH_STATUS.DELETED })
    ctx.status = 200;
    ctx.body = updatedResearch;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
};


export default {
  getResearch,
  getResearches,
  getResearchAttributeFile,
  getPublicResearchListing,
  getUserResearchListing,
  getResearchGroupResearchListing,
  getTenantResearchListing,
  createResearch,
  updateResearch,
  deleteResearch,
  createResearchApplication,
  editResearchApplication,
  approveResearchApplication,
  rejectResearchApplication,
  deleteResearchApplication,
  getResearchApplicationAttachmentFile,
  getResearchApplications
}