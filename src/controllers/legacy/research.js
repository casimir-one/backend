import fs from 'fs';
import fsExtra from 'fs-extra'
import util from 'util';
import sharp from 'sharp'
import send from 'koa-send';
import slug from 'limax';
import qs from 'qs';
import ProjectDtoService from './../../services/impl/read/ProjectDtoService';
import FileStorage from './../../storage';

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
    const result = await projectDtoService.lookupProjects(filter);
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
    const result = await projectDtoService.getProjectsForMember(member)
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
    const result = await projectDtoService.getProjectsByTeam(researchGroupExternalId);
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
    const research = await projectDtoService.getProject(researchExternalId);
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
    const researches = await projectDtoService.getProjects(researchesExternalIds);

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
  const tenantId = ctx.state.tenant.id;

  try {
    const projectDtoService = new ProjectDtoService();
    const result = await projectDtoService.getProjectsByTenant(tenantId);
    ctx.status = 200;
    ctx.body = result.filter(r => !r.isPrivate);

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
  getTenantResearchListing
}