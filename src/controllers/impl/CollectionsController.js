import { APP_CMD } from '@casimir.one/platform-core';
import qs from 'qs';
import { NFTCollectionForm } from '../../forms';
import { CollectionDTOService } from '../../services';
import BaseController from '../base/BaseController';
import { assetCmdHandler } from './../../command-handlers';
import { NotFoundError } from './../../errors';


const collectionDTOService = new CollectionDTOService();

class CollectionsController extends BaseController {

  getCollections = this.query({
    h: async (ctx) => {
      try {
        const { filter = {}, sort, page, pageSize } = qs.parse(ctx.query);
        const { 
          paginationMeta, 
          result 
        } = await collectionDTOService.getCollectionsDTOsPaginated(filter, sort, { page, pageSize });
        ctx.successRes(result, { extraInfo: paginationMeta });
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getCollection = this.query({
    h: async (ctx) => {
      try {
        const nftCollectionId = ctx.params.nftCollectionId;
        const nftCollection = await collectionDTOService.getCollectionDTO(nftCollectionId);
        if (!nftCollection) {
          throw new NotFoundError(`NFT Collection with '${nftCollectionId}' id is not found`);
        }
        ctx.successRes(nftCollection);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  createCollection = this.command({
    form: NFTCollectionForm,
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          return true;
        };
        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);
        const _id = this.extractEntityId(msg, APP_CMD.CREATE_NFT_COLLECTION);
        ctx.successRes({ _id: _id });

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  updateCollection = this.command({
    form: NFTCollectionForm,
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          return true;
        };
        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);
        const _id = this.extractEntityId(msg, APP_CMD.UPDATE_NFT_COLLECTION, '_id');
        ctx.successRes({ _id: _id });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

}


const collectionsCtrl = new CollectionsController();


module.exports = collectionsCtrl;