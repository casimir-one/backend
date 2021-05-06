import sharp from 'sharp'
import qs from 'qs';
import * as blockchainService from './../../utils/blockchain';
import FileStorage from './../../storage';
import ResearchGroupService from './../../services/legacy/researchGroup';
import ResearchGroupForm from './../../forms/legacy/researchGroup';
import ResearchGroupCreatedEvent from './../../events/legacy/researchGroupCreatedEvent';
import ResearchGroupUpdatedEvent from './../../events/legacy/researchGroupUpdatedEvent';
import ResearchGroupUpdateProposedEvent from './../../events/legacy/researchGroupUpdateProposedEvent';
import ResearchGroupUpdateProposalSignedEvent from './../../events/legacy/researchGroupUpdateProposalSignedEvent';
import UserResignationProposedEvent from './../../events/legacy/userResignationProposedEvent';
import UserResignationProposalSignedEvent from './../../events/legacy/userResignationProposalSignedEvent';


const createResearchGroup = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;

  try {
    const { tx, offchainMeta } = await ResearchGroupForm(ctx);

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    const researchGroupCreatedEvent = new ResearchGroupCreatedEvent(datums, offchainMeta);
    ctx.state.events.push(researchGroupCreatedEvent);

    const { researchGroupExternalId } = researchGroupCreatedEvent.getSourceData();
      
    ctx.status = 200;
    ctx.body = { external_id: researchGroupExternalId };

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const updateResearchGroup = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;

  try {
    const { tx, offchainMeta, isProposal } = await ResearchGroupForm(ctx);

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    if (isProposal) {
      const researchGroupUpdateProposedEvent = new ResearchGroupUpdateProposedEvent(datums, offchainMeta);
      ctx.state.events.push(researchGroupUpdateProposedEvent);

      const researchGroupUpdateApprovals = researchGroupUpdateProposedEvent.getProposalApprovals();
      for (let i = 0; i < researchGroupUpdateApprovals.length; i++) {
        const approval = researchGroupUpdateApprovals[i];
        const researchGroupUpdateProposalSignedEvent = new ResearchGroupUpdateProposalSignedEvent([approval]);
        ctx.state.events.push(researchGroupUpdateProposalSignedEvent);
      }
      
    } else {
      const researchGroupUpdatedEvent = new ResearchGroupUpdatedEvent(datums);
      ctx.state.events.push(researchGroupUpdatedEvent, offchainMeta);
    }

    ctx.status = 200;
    ctx.body = [...ctx.state.events];

  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }

  await next();
}


const leaveResearchGroup = async (ctx, next) => {
  const jwtUsername = ctx.state.user.username;
  const { tx, offchainMeta } = ctx.request.body;

  try {

    const txResult = await blockchainService.sendTransactionAsync(tx);
    const datums = blockchainService.extractOperations(tx);

    const userResignationProposedEvent = new UserResignationProposedEvent(datums, offchainMeta);
    ctx.state.events.push(userResignationProposedEvent);
    
    const userResignationApprovals = userResignationProposedEvent.getProposalApprovals();
    for (let i = 0; i < userResignationApprovals.length; i++) {
      const approval = userResignationApprovals[i];
      const userResignationProposalSignedEvent = new UserResignationProposalSignedEvent([approval]);
      ctx.state.events.push(userResignationProposalSignedEvent);
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



const uploadResearchGroupLogo = async (ctx) => {
  try {
    const researchGroupService = new ResearchGroupService();
    const { filename } = await ResearchGroupForm(ctx);
    ctx.status = 200;
    ctx.body = filename;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchGroupLogo = async (ctx) => {

  try {
    const researchGroupExternalId = ctx.params.researchGroupExternalId;
    const width = ctx.query.width ? parseInt(ctx.query.width) : 1440;
    const height = ctx.query.height ? parseInt(ctx.query.height) : 430;
    const noCache = ctx.query.noCache ? ctx.query.noCache === 'true' : false;
    const isRound = ctx.query.round ? ctx.query.round === 'true' : false;

    let src = FileStorage.getResearchGroupLogoFilePath(researchGroupExternalId);
    const defaultResearchGroupLogo = FileStorage.getResearchGroupDefaultLogoFilePath();

    let buff;

    if (src != defaultResearchGroupLogo) {
      const filepath = FileStorage.getResearchGroupLogoFilePath(researchGroupExternalId);
      const exists = await FileStorage.exists(filepath);
      if (exists) {
        buff = await FileStorage.get(filepath);
      } else {
        src = defaultResearchGroupLogo;
      }
    } else {
      src = defaultResearchGroupLogo;
    }

    const resize = (w, h) => {
      return new Promise((resolve) => {
        sharp.cache(!noCache);
        sharp(buff || src)
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

    let logo = await resize(width, height);

    if (isRound) {
      let round = (w) => {
        let r = w / 2;
        let circleShape = Buffer.from(`<svg><circle cx="${r}" cy="${r}" r="${r}" /></svg>`);
        return new Promise((resolve, reject) => {
          logo = sharp(logo)
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

      logo = await round(width);
    }

    ctx.type = 'image/png';
    ctx.body = logo;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchGroup = async (ctx) => {
  const researchGroupExternalId = ctx.params.researchGroupExternalId;
  const researchGroupService = new ResearchGroupService();

  try {

    const researchGroup = await researchGroupService.getResearchGroup(researchGroupExternalId);
    if (!researchGroup) {
      ctx.status = 404;
      ctx.body = null;
      return;
    }
    
    ctx.status = 200;
    ctx.body = researchGroup;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchGroupsByUser = async (ctx) => {
  const member = ctx.params.username;
  try {
    const researchGroupService = new ResearchGroupService();
    const researchGroups = await researchGroupService.getResearchGroupsByUser(member);
    ctx.status = 200;
    ctx.body = researchGroups;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchGroupsByTenant = async (ctx) => {
  const tenantId = ctx.params.tenantId;
  try {
    const researchGroupService = new ResearchGroupService();
    const researchGroups = await researchGroupService.getResearchGroupsByTenant(tenantId);
    ctx.status = 200;
    ctx.body = researchGroups;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}


const getResearchGroupsListing = async (ctx) => {
  const query = qs.parse(ctx.query);
  try {
    const researchGroupService = new ResearchGroupService();
    const researchGroups = await researchGroupService.getResearchGroupsListing(query.personal);
    ctx.status = 200;
    ctx.body = researchGroups;
  } catch (err) {
    console.log(err);
    ctx.status = 500;
    ctx.body = err;
  }
}



export default {
  getResearchGroup,
  getResearchGroupsListing,
  getResearchGroupsByTenant,
  createResearchGroup,
  getResearchGroupsByUser,
  updateResearchGroup,
  getResearchGroupLogo,
  uploadResearchGroupLogo,
  leaveResearchGroup
}