import sharp from 'sharp'
import slug from 'limax';
import * as blockchainService from './../../utils/blockchain';
import FileStorage from './../../storage';
import UserResignationProposedEvent from './../../events/legacy/userResignationProposedEvent';
import UserResignationProposalSignedEvent from './../../events/legacy/userResignationProposalSignedEvent';

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

const getTeamAttributeFile = async (ctx) => {
  const teamId = ctx.params.teamId;
  const attributeId = ctx.params.attributeId;
  const filename = ctx.params.filename;

  const isTeamRootFolder = teamId == attributeId;
  const filepath = isTeamRootFolder ? FileStorage.getResearchGroupFilePath(teamId, filename) : FileStorage.getResearchGroupAttributeFilePath(teamId, attributeId, filename);
  let buff = await FileStorage.get(filepath);

  try {

    const imageQuery = ctx.query.image === 'true';
    if (imageQuery) {
      const exists = await FileStorage.exists(filepath);
      if (!exists) {
        filepath = FileStorage.getResearchGroupDefaultLogoFilePath();
        buff = await FileStorage.get(filepath);
      }

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


export default {
  getResearchGroupLogo,
  leaveResearchGroup,
  getTeamAttributeFile
}