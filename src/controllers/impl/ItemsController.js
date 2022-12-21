import {
  APP_CMD,
  NftItemMetadataDraftStatus,
} from '@casimir.one/platform-core';
import qs from 'qs';
import { NFTItemMetadataForm } from '../../forms';
import {
  CollectionService,
  ItemDTOService,
  ItemService,
  TeamDtoService,
  UserService,
} from '../../services';
import BaseController from '../base/BaseController';
import { assetCmdHandler } from './../../command-handlers';
import { BadRequestError, ForbiddenError, NotFoundError } from './../../errors';


const collectionService = new CollectionService();
const nftItemService = new ItemService();

const itemDTOService = new ItemDTOService();

const teamDtoService = new TeamDtoService();
const userService = new UserService();


class ItemsController extends BaseController {

  // NFT Items

  getItem = this.query({
    h: async (ctx) => {
      try {
        const nftItemId = ctx.params.nftItemId;
        if (!nftItemId) {
          throw new BadRequestError(`'nftItemId' param is required`);
        }
        const result = await itemDTOService.getItemDTO(nftItemId);
        ctx.successRes(result);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getItems = this.query({
    h: async (ctx) => {
      try {
        const { filter = {}, sort, page, pageSize } = qs.parse(ctx.query);
        const { 
          paginationMeta, 
          result 
        } = await itemDTOService.getItemsDTOsPaginated(filter, sort, { page, pageSize });
        ctx.successRes(result, { extraInfo: paginationMeta });
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  createItem = this.command({
    form: NFTItemMetadataForm, h: async (ctx) => {

      try {
        const validate = async (appCmds) => {
          const cmd = {
            cmdNum: APP_CMD.CREATE_NFT_ITEM,
            validate: async (createNFTItemCmd) => {
              const { appCmds } = msg;
              const appCmd = appCmds.find((cmd) => cmd.getCmdNum() == APP_CMD.CREATE_NFT_ITEM);
              if (!appCmd) {
                throw new BadRequestError(`'CREATE_NFT_ITEM' is not found`);
              }
              const { nftCollectionId } = createNFTItemCmd.getCmdPayload();
              if (nftCollectionId) {
                const nftCollection = await collectionService.getCollection(nftCollectionId);
                if (!nftCollection) {
                  throw new BadRequestError(`NFT collection with '${nftCollectionId}' is not found`);
                }
              }
            }
          };

          const validCmdsOrder = [cmd];
          await this.validateCmds(appCmds, validCmdsOrder);
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);

        const nftItemId = this.extractEntityId(msg, APP_CMD.CREATE_NFT_ITEM)
        ctx.successRes({ _id: nftItemId });

      } catch (err) {
        ctx.errorRes(err);
      }
    }

  });

  updateItem = this.command({
    form: NFTItemMetadataForm, h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const cmd1 = {
            cmdNum: APP_CMD.UPDATE_NFT_ITEM,
            validate: async (updateNFTItemCmd) => {
              const { _id: nftItemId } = updateNFTItemCmd.getCmdPayload();
              const nftItem = await nftItemService.getItem(nftItemId);
              if (!nftItem) {
                throw new NotFoundError(`NFT Item with "${nftItemId}" id is not found`);
              }
            }
          };

          const validCmdsOrder = [cmd1];
          await this.validateCmds(appCmds, validCmdsOrder);
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);
        const nftItemId = this.extractEntityId(msg, APP_CMD.UPDATE_NFT_ITEM, '_id');
        ctx.successRes({ _id: nftItemId });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  deleteItem = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const cmd1 = {
            cmdNum: APP_CMD.DELETE_NFT_ITEM,
            validate: async (cmd) => {
              const { _id } = cmd.getCmdPayload();
              const nftItem = await nftItemService.getItem(_id);
              if (!nftItem) {
                throw new NotFoundError(`NFT Item with "${_id}" id is not found`);
              }

              const user = await userService.getUser(nftItem.ownerId);
              const userId = ctx.state.user._id;

              if (user) {
                if (user._id !== userId) {
                  throw new ForbiddenError(`"${userId}" is not permitted to edit "${nftItem.nftCollectionId}" nft collection`);
                }
              } else {
                const isAuthorized = await teamDtoService.authorizeTeamAccount(nftItem.ownerId, userId)
                if (!isAuthorized) {
                  throw new ForbiddenError(`"${userId}" is not permitted to edit "${nftItem.nftCollectionId}" nft collection`);
                }
              }
            }
          };

          const validCmdsOrder = [cmd1];
          await this.validateCmds(appCmds, validCmdsOrder);
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  moderateItem = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find((cmd) => cmd.getCmdNum() == APP_CMD.MODERATE_NFT_ITEM);
            if (!appCmd) {
              throw new BadRequestError(`'APP_CMD.MODERATE_NFT_ITEM' is not found`);
            }

            const { status } = appCmd.getCmdPayload();
            if (status != NftItemMetadataDraftStatus.APPROVED && status != NftItemMetadataDraftStatus.REJECTED) {
              throw new BadRequestError(`Unrecognized NFT Item status provided`);
            }
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);
        const nftItemId = this.extractEntityId(msg, APP_CMD.MODERATE_NFT_ITEM, '_id');
        ctx.successRes({ _id: nftItemId });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

}


const itemsCtrl = new ItemsController();


module.exports = itemsCtrl;