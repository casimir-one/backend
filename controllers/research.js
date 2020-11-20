import multer from 'koa-multer';
import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import path from 'path';
import sharp from 'sharp'
import config from './../config'
import send from 'koa-send';
import slug from 'limax';
import qs from 'qs';
import deipRpc from '@deip/rpc-client';
import ResearchService from './../services/research';
import ResearchGroupService from './../services/researchGroup';
import * as blockchainService from './../utils/blockchain';
import { APP_EVENTS, RESEARCH_STATUS, RESEARCH_APPLICATION_STATUS, CHAIN_CONSTANTS, RESEARCH_ATTRIBUTE_TYPE } from './../constants';
import { researchForm, researchAttributeFilePath, researchFilePath } from './../forms/research';
import { researchApplicationForm, researchApplicationAttachmentFilePath } from './../forms/researchApplicationForms';
import ResearchCreatedEvent from './../events/researchCreatedEvent';
import ResearchProposedEvent from './../events/researchProposedEvent';
import ResearchProposalSignedEvent from './../events/researchProposalSignedEvent';
import ResearchProposalRejectedEvent from './../events/researchProposalRejectedEvent';
import ResearchUpdatedEvent from './../events/researchUpdatedEvent';
import ResearchUpdateProposedEvent from './../events/researchUpdateProposedEvent';
import ResearchUpdateProposalSignedEvent from './../events/researchUpdateProposalSignedEvent';
import ResearchUpdateProposalRejectedEvent from './../events/researchUpdateProposalRejectedEvent';
import ResearchGroupCreatedEvent from './../events/researchGroupCreatedEvent';

const stat = util.promisify(fs.stat);
const unlink = util.promisify(fs.unlink);
const ensureDir = util.promisify(fsExtra.ensureDir);


const createResearch = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const tenant = ctx.state.tenant;
  const researchService = new ResearchService(tenant);
  const researchGroupsService = new ResearchGroupService();

  try {
    
    const formUploader = researchForm.any();
    const { tx, offchainMeta } = await formUploader(ctx, () => new Promise(async (resolve, reject) => {
      try {

        const tx = JSON.parse(ctx.req.body.tx);
        const onchainData = JSON.parse(ctx.req.body.onchainData);
        const offchainMeta = JSON.parse(ctx.req.body.offchainMeta);
        console.log(ctx.req.files);

        const txResult = await blockchainService.sendTransactionAsync(tx);

        resolve({
          tx,
          offchainMeta,
          onchainData
        });

      } catch (err) {
        reject(err);
      } 
    }));

    const operations = blockchainService.extractOperations(tx);
    const datums = operations;

    const invitesDatums = operations.filter(([opName]) => opName == 'join_research_group_membership');

    if (datums.some(([opName]) => opName == 'create_account')) {
      const researchGroupCreatedEvent = new ResearchGroupCreatedEvent(datums);
      ctx.state.events.push(researchGroupCreatedEvent);
    }

    if (datums.some(([opName]) => opName == 'create_proposal')) {
      const researchProposedEvent = new ResearchProposedEvent(datums, offchainMeta);
      ctx.state.events.push(researchProposedEvent);

      const researchApprovals = researchProposedEvent.getProposalApprovals();
      for (let i = 0; i < researchApprovals.length; i++) {
        const approval = researchApprovals[i];
        const researchProposalSignedEvent = new ResearchProposalSignedEvent([approval]);
        ctx.state.events.push(researchProposalSignedEvent);
      }

    } else {
      const researchCreatedEvent = new ResearchCreatedEvent(datums, offchainMeta);
      ctx.state.events.push(researchCreatedEvent);
    }

    for (let i = 0; i < invitesDatums.length; i++) {
      const inviteDatum = invitesDatums[i];
      const [opName, opPayload, inviteProposal] = inviteDatum;
      const { member: invitee, researches } = opPayload;
      const { attributes: researchAttributes } = offchainMeta;
      const usersAttributes = tenant.settings.researchAttributes.filter(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.USER);
      const inviteResearches = researches ? researches
        .map((externalId) => {
          const attributes = researchAttributes.filter(rAttr => usersAttributes.some(attr => rAttr.researchAttributeId == attr._id.toString()) && rAttr.value.some(v => v == invitee));
          return { externalId, attributes: attributes.map(rAttr => rAttr.researchAttributeId) };
        }) : [];
      ctx.state.events.push([APP_EVENTS.USER_INVITATION_PROPOSED, { opDatum: inviteDatum, context: { emitter: jwtUsername, offchainMeta: { notes: "", researches: inviteResearches } } }]);
      const approveInviteDatum = operations.find(([opName, opPayload]) => opName == 'update_proposal' && opPayload.external_id == inviteProposal.external_id);

      if (approveInviteDatum) {
        ctx.state.events.push([APP_EVENTS.USER_INVITATION_SIGNED, { opDatum: approveInviteDatum, context: { offchainMeta: {} } }]);
      }
    }

    ctx.status = 200;
    ctx.body = [...ctx.state.events];

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
};


const updateResearch = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const tenant = ctx.state.tenant;
  const researchService = new ResearchService(tenant);

  try {

    const formUploader = researchForm.any();
    const { tx, offchainMeta } = await formUploader(ctx, () => new Promise(async (resolve, reject) => {
      try {

        const tx = JSON.parse(ctx.req.body.tx);
        const onchainData = JSON.parse(ctx.req.body.onchainData);
        const offchainMeta = JSON.parse(ctx.req.body.offchainMeta);
        console.log(ctx.req.files);

        const txResult = await blockchainService.sendTransactionAsync(tx);

        resolve({
          tx,
          offchainMeta,
          onchainData
        });

      } catch (err) {
        reject(err);
      }
    }));

    const operations = blockchainService.extractOperations(tx);
    const datums = operations;

    if (datums.some(([opName]) => opName == 'create_proposal')) {
      const researchUpdateProposedEvent = new ResearchUpdateProposedEvent(datums, offchainMeta);
      ctx.state.events.push(researchUpdateProposedEvent);

      const researchUpdateApprovals = researchUpdateProposedEvent.getProposalApprovals();
      for (let i = 0; i < researchUpdateApprovals.length; i++) {
        const approval = researchUpdateApprovals[i];
        const researchUpdateProposalSignedEvent = new ResearchUpdateProposalSignedEvent([approval]);
        ctx.state.events.push(researchUpdateProposalSignedEvent);
      }
    } else {
      const researchUpdatedEvent = new ResearchUpdatedEvent(datums, offchainMeta);
      ctx.state.events.push(researchUpdatedEvent);
    }

    const invitesDatums = operations.filter(([opName]) => opName == 'join_research_group_membership');
    for (let i = 0; i < invitesDatums.length; i++) {
      const inviteDatum = invitesDatums[i];
      const [opName, opPayload, inviteProposal] = inviteDatum;
      const { member: invitee, researches } = opPayload;
      const { attributes: researchAttributes } = offchainMeta;
      const usersAttributes = tenant.settings.researchAttributes.filter(attr => attr.type == RESEARCH_ATTRIBUTE_TYPE.USER);
      const inviteResearches = researches ? researches
        .map((externalId) => {
          const attributes = researchAttributes.filter(rAttr => usersAttributes.some(attr => rAttr.researchAttributeId.toString() == attr._id.toString()) && rAttr.value.some(v => v == invitee));
          return { externalId, attributes: attributes.map(rAttr => rAttr.researchAttributeId) };
        }) : [];
        
      ctx.state.events.push([APP_EVENTS.USER_INVITATION_PROPOSED, { opDatum: inviteDatum, context: { emitter: jwtUsername, offchainMeta: { notes: "", researches: inviteResearches } } }]);
      const approveInviteDatum = operations.find(([opName, opPayload]) => opName == 'update_proposal' && opPayload.external_id == inviteProposal.external_id);

      if (approveInviteDatum) {
        ctx.state.events.push([APP_EVENTS.USER_INVITATION_SIGNED, { opDatum: approveInviteDatum, context: { offchainMeta: {} } }]);
      }
    }

    ctx.status = 200;
    ctx.body = [...ctx.state.events];

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
};



const createResearchApplication = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const tenant = ctx.state.tenant;
  const researchService = new ResearchService(tenant);

  try {

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
    const proposal = await deipRpc.api.getProposalAsync(form.proposalId);
    const isAccepted = proposal == null;

    const researchApplicationRm = await researchService.createResearchApplication({
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

    const researchApplication = researchApplicationRm.toObject();

    ctx.status = 200;
    ctx.body = { txResult, tx: form.tx, rm: researchApplication };

    if (!isAccepted) {
      ctx.state.events.push([APP_EVENTS.RESEARCH_APPLICATION_CREATED, { tx: form.tx, emitter: jwtUsername }]);
    } else {
      const research = await deipRpc.api.getResearchAsync(form.researchExternalId);
      await researchService.createResearchRef({
        externalId: research.external_id,
        status: RESEARCH_STATUS.APPROVED,
        researchGroupExternalId: research.research_group.external_id,
        researchGroupInternalId: research.research_group.id,
        title: research.title,
        abstract: research.abstract,
        attributes: researchApplication.attributes || []
      });

      const create_research_operation = form.tx['operations'][0][1]['proposed_ops'][1]['op'][1]['proposed_ops'][0]['op'];
      const tx = { 'operations': [create_research_operation]}

      const datums = blockchainService.extractOperations(tx);
      const researchCreatedEvent = new ResearchCreatedEvent(datums);
      ctx.state.events.push(researchCreatedEvent);
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
  const tenant = ctx.state.tenant;
  const researchService = new ResearchService(tenant);
  const applicationId = ctx.params.proposalId;

  try {

    const researchApplication = await researchService.findResearchApplicationById(applicationId);
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


    const researchApplicationData = researchApplication.toObject();
    const updatedResearchApplication = await researchService.updateResearchApplication(applicationId, {
      ...researchApplicationData,
      ...update
    });

    ctx.status = 200;
    ctx.body = { rm: updatedResearchApplication };

    ctx.state.events.push([APP_EVENTS.RESEARCH_APPLICATION_EDITED, { tx: researchApplicationData.tx, emitter: jwtUsername }]);

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
};


const getResearchApplicationAttachmentFile = async function (ctx) {
  const jwtUsername = ctx.state.user.username;
  const tenant = ctx.state.tenant;
  const researchService = new ResearchService(tenant);
  const applicationId = ctx.params.proposalId;
  const filename = ctx.query.filename;
  const isDownload = ctx.query.download === 'true';

  try {

    if (!filename) {
      ctx.status = 400;
      ctx.body = `"filename" query param is required`;
      return;
    }

    const researchApplication = await researchService.findResearchApplicationById(applicationId);
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
  const jwtUsername = ctx.state.user.username;
  const tenant = ctx.state.tenant;
  const { tx } = ctx.request.body;

  const researchService = new ResearchService(tenant);
  const researchGroupsService = new ResearchGroupService();

  try { 

    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: applicationId } = payload;

    const researchApplication = await researchService.findResearchApplicationById(applicationId);
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

    const research = await deipRpc.api.getResearchAsync(researchApplication.researchExternalId);
    const researcRm = await researchService.createResearchRef({
      externalId: research.external_id,
      status: RESEARCH_STATUS.APPROVED,
      researchGroupExternalId: research.research_group.external_id,
      researchGroupInternalId: research.research_group.id,
      title: research.title,
      abstract: research.abstract,
      attributes: researchApplication.attributes || []
    });

    await researchGroupsService.createResearchGroupRef({
      externalId: research.research_group.external_id,
      creator: researchApplication.researcher
    });

    if (datums.some(([opName]) => opName == 'create_account')) {
      const researchGroupCreatedEvent = new ResearchGroupCreatedEvent(datums);
      ctx.state.events.push(researchGroupCreatedEvent);
    }

    const researchApplicationData = researchApplication.toObject();
    const updatedResearchApplication = await researchService.updateResearchApplication(applicationId, {
      ...researchApplicationData,
      status: RESEARCH_APPLICATION_STATUS.APPROVED
    });
    
    ctx.status = 200;
    ctx.body = { tx, txResult, rm: researcRm };

    if (isAccepted) {
      ctx.state.events.push([APP_EVENTS.RESEARCH_APPLICATION_APPROVED, { tx: researchApplicationData.tx, emitter: jwtUsername }]);
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
  const tenant = ctx.state.tenant;
  const researchService = new ResearchService(tenant);
  const { tx } = ctx.request.body;

  try { 

    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: applicationId } = payload;

    const researchApplication = await researchService.findResearchApplicationById(applicationId);
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

    const researchApplicationData = researchApplication.toObject();
    const updatedResearchApplication = await researchService.updateResearchApplication(applicationId, {
      ...researchApplicationData,
      status: RESEARCH_APPLICATION_STATUS.REJECTED
    });

    ctx.status = 200;
    ctx.body = { tx, txResult };

    ctx.state.events.push([APP_EVENTS.RESEARCH_APPLICATION_REJECTED, { tx: researchApplicationData.tx, emitter: jwtUsername }]);
    
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const deleteResearchApplication = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const tenant = ctx.state.tenant;
  const researchService = new ResearchService(tenant);
  const { tx } = ctx.request.body;

  try {

    const operation = tx['operations'][0];
    const payload = operation[1];
    const { external_id: applicationId } = payload;

    const researchApplication = await researchService.findResearchApplicationById(applicationId);
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

    const researchApplicationData = researchApplication.toObject();
    const updatedResearchApplication = await researchService.updateResearchApplication(applicationId, {
      ...researchApplicationData,
      status: RESEARCH_APPLICATION_STATUS.DELETED
    });

    ctx.status = 200;
    ctx.body = { tx, txResult };

    ctx.state.events.push([APP_EVENTS.RESEARCH_APPLICATION_DELETED, { tx: researchApplicationData.tx, emitter: jwtUsername }]);
    
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const getResearchApplications = async (ctx) => {
  const tenant = ctx.state.tenant;
  const researchService = new ResearchService(tenant);
  const status = ctx.query.status;
  const researcher = ctx.query.researcher;

  try {
    const result = await researchService.getResearchApplications({ status, researcher });
    ctx.status = 200;
    ctx.body = result;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const createResearchTokenSale = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx } = ctx.request.body;

  try {

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const operations = blockchainService.extractOperations(tx);

    const researchTokenSaleDatum = operations.find(([opName]) => opName == 'create_research_token_sale');

    const [opName, researchTokenSalePayload, researchTokenSaleProposal] = researchTokenSaleDatum;
    if (researchTokenSaleProposal) {
      ctx.state.events.push([APP_EVENTS.RESEARCH_TOKEN_SALE_PROPOSED, { opDatum: researchTokenSaleDatum, context: { emitter: jwtUsername } }]);
    } else {
      ctx.state.events.push([APP_EVENTS.RESEARCH_TOKEN_SALE_CREATED, { opDatum: researchTokenSaleDatum, context: { emitter: jwtUsername } }]);
    }

    ctx.status = 200;
    ctx.body = researchTokenSalePayload;

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const createResearchTokenSaleContribution = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, isProposal } = ctx.request.body;

  try {
    const operation = isProposal ? tx['operations'][0][1]['proposed_ops'][0]['op'] : tx['operations'][0];
    const payload = operation[1];

    const txResult = await blockchainService.sendTransactionAsync(tx);

    ctx.status = 200;
    ctx.body = { txResult };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}



const getResearchAttributeFile = async (ctx) => {
  const researchExternalId = ctx.params.researchExternalId;
  const researchAttributeId = ctx.params.researchAttributeId;
  const filename = ctx.params.filename;
  const tenant = ctx.state.tenant;

  const isResearchRootFolder = researchExternalId == researchAttributeId;
  const filepath = isResearchRootFolder ? researchFilePath(researchExternalId, filename) : researchAttributeFilePath(researchExternalId, researchAttributeId, filename);

  try {

    const isImage = ctx.query.image === 'true';

    if (isImage) {

      const width = ctx.query.width ? parseInt(ctx.query.width) : 1440;
      const height = ctx.query.height ? parseInt(ctx.query.height) : 430;
      const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
      const isRound = ctx.query.round ? ctx.query.round === 'true' : false;

      const check = await stat(filepath);
      const resize = (w, h) => {
        return new Promise((resolve) => {
          sharp.cache(!noCache);
          sharp(filepath)
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
      if (isDownload) {
        let ext = filename.substr(filename.lastIndexOf('.') + 1);
        let name = filename.substr(0, filename.lastIndexOf('.'));
        ctx.response.set('Content-disposition', `attachment; filename="${slug(name)}.${ext}"`);
        ctx.body = fs.createReadStream(filepath);
      } else {
        await send(ctx, filepath, { root: '/' });
      }
    }

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getPublicResearchListing = async (ctx) => {
  const tenant = ctx.state.tenant;
  const query = qs.parse(ctx.query);
  const filter = query.filter;

  const researchService = new ResearchService(tenant);
  const researchWhitelist = tenant.settings.researchWhitelist || [];
  const researchBlacklist = tenant.settings.researchBlacklist || [];


  try {
    const result = await researchService.lookupResearches(0, CHAIN_CONSTANTS.API_BULK_FETCH_LIMIT, filter);
    ctx.status = 200;
    ctx.body = result
      .filter(r => !researchWhitelist.length || researchWhitelist.some(id => r.external_id == id))
      .filter(r => !researchBlacklist.length || !researchBlacklist.some(id => r.external_id == id));
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};


const getUserResearchListing = async (ctx) => {
  const jwtUsername = ctx.state.user.username;
  const tenant = ctx.state.tenant;
  const member = ctx.params.username;

  const researchService = new ResearchService(tenant);
  const researchWhitelist = tenant.settings.researchWhitelist || [];
  const researchBlacklist = tenant.settings.researchBlacklist || [];

  try {
    const result = await researchService.getResearchesForMember(member, jwtUsername)
    ctx.status = 200;
    ctx.body = result
      .filter(r => !researchWhitelist.length || researchWhitelist.some(id => r.external_id == id))
      .filter(r => !researchBlacklist.length || !researchBlacklist.some(id => r.external_id == id));
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};


const getResearchGroupResearchListing = async (ctx) => {
  const tenant = ctx.state.tenant;
  const jwtUsername = ctx.state.user.username;
  const researchGroupExternalId = ctx.params.researchGroupExternalId;

  const researchService = new ResearchService(tenant);
  const researchWhitelist = tenant.settings.researchWhitelist || [];
  const researchBlacklist = tenant.settings.researchBlacklist || [];

  try {
    const result = await researchService.getResearchesForMemberByResearchGroup(researchGroupExternalId, jwtUsername);
    ctx.status = 200;
    ctx.body = result
      .filter(r => !researchWhitelist.length || researchWhitelist.some(id => r.external_id == id))
      .filter(r => !researchBlacklist.length || !researchBlacklist.some(id => r.external_id == id))
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};


const getResearch = async (ctx) => {
  const tenant = ctx.state.tenant;
  const researchExternalId = ctx.params.researchExternalId;

  const researchService = new ResearchService(tenant);
  const researchWhitelist = tenant.settings.researchWhitelist || [];
  const researchBlacklist = tenant.settings.researchBlacklist || [];

  try { 

    const research = await researchService.getResearch(researchExternalId);
    if (!research) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    const result = [research]
      .filter(r => !researchWhitelist.length || researchWhitelist.some(id => r.external_id == id))
      .filter(r => !researchBlacklist.length || !researchBlacklist.some(id => r.external_id == id))
   
    if (!result.length) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }

    ctx.status = 200;
    ctx.body = research;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err.message;
  }
};


export default {
  getResearchAttributeFile,
  getResearch,
  getPublicResearchListing,
  getUserResearchListing,
  getResearchGroupResearchListing,
  updateResearch,
  createResearch,
  createResearchApplication,
  editResearchApplication,
  approveResearchApplication,
  rejectResearchApplication,
  deleteResearchApplication,
  getResearchApplicationAttachmentFile,
  getResearchApplications,
  createResearchTokenSale,
  createResearchTokenSaleContribution
}