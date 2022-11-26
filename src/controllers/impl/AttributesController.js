import { APP_CMD, AttributeScope } from '@casimir.one/platform-core';
import BaseController from './../base/BaseController';
import { BadRequestError, NotFoundError } from './../../errors';
import {attributeCmdHandler} from './../../command-handlers';
import {AttributeDtoService} from './../../services';
import FileStorage from './../../storage';
import sharp from 'sharp';
import slug from 'limax';

const attributeDtoService = new AttributeDtoService();

class AttributesController extends BaseController {
  
  getAttributes = this.query({
    h: async (ctx) => {
      try {
        const attributes = await attributeDtoService.getAttributes();
        ctx.successRes(attributes);
      } catch (err) {
        console.error(err);
        ctx.errorRes(err);
      }
    }
  });

  getAttributesByScope = this.query({
    h: async (ctx) => {
      try {
        const scope = ctx.params.scope;
        const attributes = await attributeDtoService.getAttributesByScope(scope);
        ctx.successRes(attributes);
      } catch (err) {
        console.error(err);
        ctx.errorRes(err);
      }
    }
  });

  getAttribute = this.query({
    h: async (ctx) => {
      try {
        const attributeId = ctx.params.id;
        const attributes = await attributeDtoService.getAttribute(attributeId);
        ctx.successRes(attributes);
      } catch (err) {
        console.error(err);
        ctx.errorRes(err);
      }
    }
  });

  createAttribute = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const createAttributeSettings = {
            cmdNum: APP_CMD.CREATE_ATTRIBUTE
          };

          const validCmdsOrder = [createAttributeSettings];

          await this.validateCmds(appCmds, validCmdsOrder);         
        };

        const msg = ctx.state.msg;

        await attributeCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  updateAttribute = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const updateAttributeSettings = {
            cmdNum: APP_CMD.UPDATE_ATTRIBUTE
          };

          const validCmdsOrder = [updateAttributeSettings];

          await this.validateCmds(appCmds, validCmdsOrder);         
        };

        const msg = ctx.state.msg;

        await attributeCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  deleteAttribute = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const deleteAttributeSettings = {
            cmdNum: APP_CMD.DELETE_ATTRIBUTE
          };

          const validCmdsOrder = [deleteAttributeSettings];

          await this.validateCmds(appCmds, validCmdsOrder);         
        };

        const msg = ctx.state.msg;

        await attributeCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getAttributeFile = this.query({
    h: async (ctx) => {
      try {
        const scope = ctx.params.scope;
        const entityId = ctx.params.entityId;
        const attributeId = ctx.params.attributeId;
        const filename = ctx.params.filename;

        const isEntityRootFolder = entityId == attributeId;
        const imageQuery = ctx.query.image === 'true';
        let filepath = '';
        switch (scope) {
          case AttributeScope.NFT_COLLECTION:
            filepath = isEntityRootFolder ? FileStorage.getNFTCollectionFilePath(entityId, filename) : FileStorage.getNFTCollectionAttributeFilePath(entityId, attributeId, filename);
            const fileExists = await FileStorage.exists(filepath);
            if (!fileExists) {
              throw new NotFoundError(`${filepath} is not found`);
            }
            break;
          case AttributeScope.NFT_ITEM:
            const { nftCollectionId, nftItemId } = JSON.parse(entityId);
            filepath = attributeId ? FileStorage.getNFTItemMetadataAttributeFilePath(nftCollectionId, nftItemId, attributeId, filename) : FileStorage.getNFTItemMetadataFilePath(nftCollectionId, nftItemId, filename);
            const nftItemFileExists = await FileStorage.exists(filepath);
            if (!nftItemFileExists) {
              throw new NotFoundError(`${filepath} is not found`);
            }
            break;
          case AttributeScope.TEAM:
            filepath = isEntityRootFolder ? FileStorage.getTeamFilePath(entityId, filename) : FileStorage.getTeamAttributeFilePath(entityId, attributeId, filename);
            if (imageQuery) {
              const exists = await FileStorage.exists(filepath);
              if (!exists) {
                filepath = FileStorage.getTeamDefaultLogoFilePath();
              }
            }
            break;
          case AttributeScope.USER:
            filepath = isEntityRootFolder ? FileStorage.getAccountFilePath(entityId, filename) : FileStorage.getAccountAttributeFilePath(entityId, attributeId, filename);
            if (imageQuery) {
              const exists = await FileStorage.exists(filepath);
              if (!exists) {
                filepath = FileStorage.getAccountDefaultAvatarFilePath();
              }
            }
            break;
          default:
            throw new BadRequestError(`Unknown ${scope} scope`);
        }
        const buff = await FileStorage.get(filepath);
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
                  .overlayWith(circleShape, {
                    cutout: true
                  })
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
          ctx.successRes(image, { withoutWrap: true });
        } else {
          const isDownload = ctx.query.download === 'true';
          const ext = filename.substr(filename.lastIndexOf('.') + 1);
          const name = filename.substr(0, filename.lastIndexOf('.'));
          const isImage = ['png', 'jpeg', 'jpg'].some(e => e == ext);
          const isPdf = ['pdf'].some(e => e == ext);
          if (isDownload) {
            ctx.response.set('Content-Disposition', `attachment; filename="${slug(name)}.${ext}"`);
            ctx.successRes(buff, { withoutWrap: true });
          } else if (isImage) {
            ctx.response.set('Content-Type', `image/${ext}`);
            ctx.response.set('Content-Disposition', `inline; filename="${slug(name)}.${ext}"`);
            ctx.successRes(buff, { withoutWrap: true });
          } else if (isPdf) {
            ctx.response.set('Content-Type', `application/${ext}`);
            ctx.response.set('Content-Disposition', `inline; filename="${slug(name)}.${ext}"`);
            ctx.successRes(buff, { withoutWrap: true });
          } else {
            ctx.response.set('Content-Disposition', `attachment; filename="${slug(name)}.${ext}"`);
            ctx.successRes(buff, { withoutWrap: true });
          }
        }
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });
}

const attributesCtrl = new AttributesController();

module.exports = attributesCtrl;