import { ChainService } from '@casimir.one/chain-service';
import {
  APP_CMD,
  APP_PROPOSAL,
  NftItemMetadataDraftStatus,
} from '@casimir.one/platform-core';
import mongoose from 'mongoose';
import qs from 'qs';
import { NFTCollectionForm, NFTItemMetadataForm } from '../../forms';
import {
  FTClassDtoService,
  NFTCollectionDTOService,
  NFTCollectionService,
  NFTItemDTOService,
  NFTItemService,
  TeamDtoService,
  UserDtoService,
  UserService,
  ProposalDtoService,
} from '../../services';
import BaseController from '../base/BaseController';
import { assetCmdHandler } from './../../command-handlers';
import config from './../../config';
import { BadRequestError, ConflictError, ForbiddenError, NotFoundError } from './../../errors';
import FileStorage from './../../storage';


const nftCollectionService = new NFTCollectionService();
const teamDtoService = new TeamDtoService();
const nftItemService = new NFTItemService();
const userDtoService = new UserDtoService();
const ftClassDtoService = new FTClassDtoService();
const nftCollectionDtoService = new NFTCollectionDTOService();
const nftItemDtoService = new NFTItemDTOService();
const userService = new UserService();
const proposalDtoService = new ProposalDtoService();

const validateEmail = (email) => {
  const patternStr = ['^(([^<>()[\\]\\.,;:\\s@"]+(\\.[^<>()\\[\\]\\.,;:\\s@"]+)*)',
    '|(".+"))@((\\[[0-9]{1,3}\\.[0-9]{1,3}\\.[0-9]{1,3}\\.',
    '[0-9]{1,3}])|(([a-zA-Z\\-0-9]+\\.)+',
    '[a-zA-Z]{2,}))$'].join('');
  const pattern = new RegExp(patternStr);

  return pattern.test(email) && email.split('@')[0].length <= 64;
}

class AssetsController extends BaseController {

  // NFT Collections

  getNFTCollection = this.query({
    h: async (ctx) => {
      try {
        const nftCollectionId = ctx.params.nftCollectionId;
        const nftCollection = await nftCollectionDtoService.getNFTCollectionDTO(nftCollectionId);
        if (!nftCollection) {
          throw new NotFoundError(`NFT Collection with '${nftCollectionId}' id is not found`);
        }
        ctx.successRes(nftCollection);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNFTCollections = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const filter = query.filter;
        const result = await nftCollectionDtoService.getNFTCollectionsDTOs(filter);
        ctx.successRes(result);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  createNFTCollection = this.command({
    form: NFTCollectionForm,
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          return true;
        };
        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);
        const entityId = this.extractEntityId(msg, APP_CMD.CREATE_NFT_COLLECTION);
        ctx.successRes({ _id: entityId });

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  updateNFTCollection = this.command({
    form: NFTCollectionForm,
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          return true;
        };
        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);
        const entityId = this.extractEntityId(msg, APP_CMD.UPDATE_NFT_COLLECTION, '_id');
        ctx.successRes({ _id: entityId });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  // NFT Items

  getNFTItem = this.query({
    h: async (ctx) => {
      try {
        const nftItemId = ctx.params.nftItemId;
        const result = await nftItemDtoService.getNFTItemDTO(nftItemId);
        ctx.successRes(result);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNFTItemsPaginated = this.query({
    h: async (ctx) => {
      try {
        const { filter = {}, sort, page, pageSize } = qs.parse(ctx.query);
        const { 
          paginationMeta, 
          result 
        } = await nftItemDtoService.getNFTItemsDTOsPaginated(filter, sort, { page, pageSize });
        ctx.successRes(result, { extraInfo: paginationMeta });
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  createNFTItem = this.command({
    form: NFTItemMetadataForm, h: async (ctx) => {
      try {
        let email;

        const validate = async (appCmds) => {
          const cmd = {
            cmdNum: APP_CMD.CREATE_NFT_ITEM,
            validate: async (createNFTItemCmd) => {
              const { appCmds } = msg;
              const appCmd = appCmds.find((cmd) => cmd.getCmdNum() == APP_CMD.CREATE_NFT_ITEM);
              if (!appCmd) {
                throw new BadRequestError(`'CREATE_NFT_ITEM' is not found`);
              }

              email = appCmd.getCmdPayload().ownerId; // temp wip
              if (!email || !validateEmail(email)) {
                throw new BadRequestError(`Email is invalid or not provided`);
              }

              const { nftCollectionId } = createNFTItemCmd.getCmdPayload();
              if (nftCollectionId) {
                const nftCollection = await nftCollectionService.getNFTCollection(nftCollectionId);
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

  updateNFTItem = this.command({
    form: NFTItemMetadataForm, h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const cmd1 = {
            cmdNum: APP_CMD.UPDATE_NFT_ITEM,
            validate: async (updateNFTItemCmd) => {
              const { _id: nftItemId } = updateNFTItemCmd.getCmdPayload();
              const nftItem = await nftItemService.getNFTItem(nftItemId);
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

  deleteNFTItem = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const cmd1 = {
            cmdNum: APP_CMD.DELETE_NFT_ITEM,
            validate: async (cmd) => {
              const { _id } = cmd.getCmdPayload();
              const nftItem = await nftItemService.getNFTItem(_id);
              if (!nftItem) {
                throw new NotFoundError(`NFT Item with "${_id}" id is not found`);
              }

              const user = await userService.getUser(nftItem.ownerId);
              const username = ctx.state.user.username;

              if (user) {
                if (user._id !== username) {
                  throw new ForbiddenError(`"${username}" is not permitted to edit "${nftItem.nftCollectionId}" nft collection`);
                }
              } else {
                const isAuthorized = await teamDtoService.authorizeTeamAccount(nftItem.ownerId, username)
                if (!isAuthorized) {
                  throw new ForbiddenError(`"${username}" is not permitted to edit "${nftItem.nftCollectionId}" nft collection`);
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

  moderateNFTItem = this.command({
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

  getFTClassById = this.query({
    h: async (ctx) => {
      try {
        const assetId = ctx.params.assetId;
        const asset = await ftClassDtoService.getFTClassById(assetId);
        if (!asset) {
          throw new NotFoundError(`Asset "${assetId}" is not found`);
        }
        ctx.successRes(asset);
      }
      catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getFTClassBySymbol = this.query({
    h: async (ctx) => {
      try {
        const symbol = ctx.params.symbol;
        const assets = await ftClassDtoService.getFTClassBySymbol(symbol);
        if (!assets) {
          throw new NotFoundError(`Asset "${symbol}" is not found`);
        }
        ctx.successRes(assets);
      }
      catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getFTClassesByIssuer = this.query({
    h: async (ctx) => {
      try {
        const issuer = ctx.params.issuer;
        const assets = await ftClassDtoService.getFTClassesByIssuer(issuer);
        ctx.successRes(assets);
      }
      catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  lookupFTClassess = this.query({
    h: async (ctx) => {
      try {
        const { lowerBoundSymbol, limit } = ctx.params;
        const assets = await ftClassDtoService.lookupFTClassess(lowerBoundSymbol, limit);
        ctx.successRes(assets);
      }
      catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getFTClassBalance = this.query({
    h: async (ctx) => {
      try {
        const { ownerId, symbol } = ctx.params;
        const asset = await ftClassDtoService.getFTClassBalance(ownerId, symbol);
        if (!asset) {
          throw new NotFoundError(`Asset "${symbol}" is not found`);
        }
        ctx.successRes(asset);
      }
      catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getFTClassBalancesByOwner = this.query({
    h: async (ctx) => {
      try {
        const ownerId = ctx.params.ownerId;
        const asset = await ftClassDtoService.getFTClassBalancesByOwner(ownerId);
        ctx.successRes(asset);
      }
      catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getFTClassBalancesBySymbol = this.query({
    h: async (ctx) => {
      try {
        const symbol = ctx.params.symbol;
        const assets = await ftClassDtoService.getFTClassBalancesBySymbol(symbol);
        ctx.successRes(assets);
      }
      catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  createFTTransferRequest = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const validateAcceptProposal = (acceptProposalCmd, cmdStack) => {
            const { entityId } = acceptProposalCmd.getCmdPayload();
            const createProposalCmd = cmdStack.find(c => c.getCmdPayload().entityId === entityId);
            if (!createProposalCmd) {
              throw new BadRequestError(`Can't accept proposal`);
            }
          };

          const createFTTransferRequestSettings = {
            cmdNum: APP_CMD.TRANSFER_FT
          }

          const createProposalSettings = {
            cmdNum: APP_CMD.CREATE_PROPOSAL,
            proposalType: APP_PROPOSAL.FT_TRANSFER_PROPOSAL,
            proposedCmdsOrder: [createFTTransferRequestSettings]
          };

          const acceptProposalSettings = {
            cmdNum: APP_CMD.ACCEPT_PROPOSAL,
            validate: validateAcceptProposal
          }

          // array of orders if can be a few valid orders
          const validCmdsOrders = [
            [createFTTransferRequestSettings],
            [createProposalSettings],
            [createProposalSettings, acceptProposalSettings]
          ];

          await this.validateCmds(appCmds, validCmdsOrders);
        };

        const msg = ctx.state.msg;

        await assetCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  createFTClass = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const createFTSettings = {
            cmdNum: APP_CMD.CREATE_FT
          };

          const validCmdsOrder = [createFTSettings];

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

  issueFT = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const issueFTSettings = {
            cmdNum: APP_CMD.ISSUE_FT
          };

          const validCmdsOrder = [issueFTSettings];

          await this.validateCmds(appCmds, validCmdsOrder);
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);

        ctx.status = 200;
        ctx.body = {
          model: "ok"
        };

      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

}


const assetsCtrl = new AssetsController();


module.exports = assetsCtrl;