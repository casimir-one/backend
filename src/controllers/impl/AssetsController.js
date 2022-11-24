import { ChainService } from '@casimir.one/chain-service';
import { AcceptProposalCmd, DeclineProposalCmd } from '@casimir.one/commands';
import {
  APP_CMD,
  APP_PROPOSAL,
  NftItemMetadataDraftStatus,
  NFT_ITEM_METADATA_FORMAT
} from '@casimir.one/platform-core';
import slug from 'limax';
import mongoose from 'mongoose';
import qs from 'qs';
import { NFTCollectionForm, NFTItemMetadataForm } from '../../forms';
import {
  AssetDtoService,
  FTClassDtoService,
  NFTCollectionDtoService,
  NFTCollectionMetadataService,
  NFTItemDtoService,
  NFTItemMetadataDraftService,
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


const nftCollectionMetadataService = new NFTCollectionMetadataService();
const teamDtoService = new TeamDtoService();
const nftItemMetadataDraftService = new NFTItemMetadataDraftService();
const assetDtoService = new AssetDtoService();
const userDtoService = new UserDtoService();
const ftClassDtoService = new FTClassDtoService();
const nftCollectionDtoService = new NFTCollectionDtoService();
const nftItemDtoService = new NFTItemDtoService();
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
  getAssetsByType = this.query({
    h: async (ctx) => {
      try {
        const type = ctx.params.type
        const assets = await assetDtoService.getAssetsByType(type);
        ctx.successRes(assets);
      }
      catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getAssetsByIssuer = this.query({
    h: async (ctx) => {
      try {
        const issuer = ctx.params.issuer
        const assets = await assetDtoService.getAssetsByIssuer(issuer);
        ctx.successRes(assets);
      }
      catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  lookupAssets = this.query({
    h: async (ctx) => {
      try {
        const limit = ctx.params.limit;
        const assets = await assetDtoService.lookupAssets(limit);
        ctx.successRes(assets);
      }
      catch (err) {
        console.log(err);
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
        const { owner, symbol } = ctx.params;
        const asset = await ftClassDtoService.getFTClassBalance(owner, symbol);
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
        const owner = ctx.params.owner;
        const asset = await ftClassDtoService.getFTClassBalancesByOwner(owner);
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


  getNFTCollection = this.query({
    h: async (ctx) => {
      try {
        const nftCollectionId = ctx.params.nftCollectionId;
        const nftCollection = await nftCollectionDtoService.getNFTCollection(nftCollectionId);
        if (!nftCollection) {
          throw new NotFoundError(`NftCollection "${nftCollectionId}" id is not found`);
        }
        ctx.successRes(nftCollection);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNFTCollectionsByIds = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const nftCollectionIds = query.nftCollectionIds;
        if (!Array.isArray(nftCollectionIds)) {
          throw new BadRequestError(`nftCollectionIds must be an array of ids`);
        }

        const result = await nftCollectionDtoService.getNFTCollections(nftCollectionIds);
        ctx.successRes(result);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getPublicNFTCollectionsListing = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const filter = query.filter;
        const result = await nftCollectionDtoService.lookupNFTCollections(filter);
        ctx.successRes(result);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }

    }
  });

  getNFTCollectionsByIssuer = this.query({
    h: async (ctx) => {
      try {
        const issuer = ctx.params.issuer;
        const result = await nftCollectionDtoService.getNFTCollectionsByIssuer(issuer);
        ctx.successRes(result);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }

    }
  });

  getNFTCollectionsByPortal = this.query({
    h: async (ctx) => {
      try {
        const portalId = ctx.state.portal.id;
        const result = await nftCollectionDtoService.getNFTCollectionsByPortal(portalId);
        ctx.successRes(result);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  getNFTItemsByPortal = this.query({
    h: async (ctx) => {
      try {
        const portalId = ctx.params.portalId;
        const result = await nftItemDtoService.getNFTItemsByPortal(portalId)
        ctx.successRes(result);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  getNFTItemsMetadataDraftsListingPaginated = this.query({
    h: async (ctx) => {
      try {
        const { filter = {}, sort, page, pageSize } = qs.parse(ctx.query);
        const {
          paginationMeta,
          result
        } = await nftItemDtoService.lookupNFTItemMetadataDraftsWithPagination(filter, sort, { page, pageSize });

        ctx.successRes(result, { extraInfo: paginationMeta });
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNFTItemMetadataDraftsByNFTCollection = this.query({
    h: async (ctx) => {
      try {

        const nftCollectionId = ctx.params.nftCollectionId;
        const result = await nftItemDtoService.getNFTItemMetadataDraftsByNFTCollection(nftCollectionId);
        ctx.successRes(result);

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNFTItemMetadataDraft = this.query({
    h: async (ctx) => {
      try {

        const nftItemDraftId = ctx.params.nftItemDraftId;
        const result = await nftItemMetadataDraftService.getNFTItemMetadataDraft(nftItemDraftId);
        ctx.successRes(result);

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  createNFTItemMetadataDraft = this.command({
    form: NFTItemMetadataForm, h: async (ctx) => {
      try {
        console.log("In controller createNFTItemMetadataDraft")

        let email;
        
        const validate = async (appCmds) => {
          const validateCreateNFTItemMetadataDraft = async (createNFTItemMetadataDraftCmd, cmdStack) => {
            const { nftCollectionId } = createNFTItemMetadataDraftCmd.getCmdPayload();
            const nftCollection = await nftCollectionMetadataService.getNFTCollectionMetadata(nftCollectionId);
            const { appCmds } = msg;
            const appCmd = appCmds.find((cmd) => cmd.getCmdNum() == APP_CMD.CREATE_NFT_ITEM_METADATA_DRAFT);
            if (!appCmd) {
              throw new BadRequestError(`'CREATE_NFT_ITEM_METADATA_DRAFT' is not found`);
            }

            email = appCmd.getCmdPayload().owner;
            if (!email || !validateEmail(email)) {
              throw new BadRequestError(`Email is invalid or not provided`);
            }

            if (!nftCollection) {
              throw new BadRequestError(`Nft collection "${nftCollectionId}" doesn't exist`);
            }
          };

          const createNFTItemMetadataDraftSettings = {
            cmdNum: APP_CMD.CREATE_NFT_ITEM_METADATA_DRAFT,
            validate: validateCreateNFTItemMetadataDraft
          };

          const validCmdsOrder = [createNFTItemMetadataDraftSettings];

          await this.validateCmds(appCmds, validCmdsOrder);
        };

        const msg = ctx.state.msg;

        await assetCmdHandler.process(msg, ctx, validate);

        const entityId = this.extractEntityId(msg, APP_CMD.CREATE_NFT_ITEM_METADATA_DRAFT)
        const nftItemDraftId = mongoose.Types.ObjectId(entityId);

        ctx.successRes({
          _id: nftItemDraftId
        });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  updateNFTItemMetadataDraft = this.command({
    form: NFTItemMetadataForm, h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const validateUpdateNFTItemMetadataDraft = async (updateNFTItemMetadataDraftCmd, cmdStack) => {
            const { _id: nftItemDraftId } = updateNFTItemMetadataDraftCmd.getCmdPayload();

            const draft = await nftItemMetadataDraftService.getNFTItemMetadataDraft(nftItemDraftId);

            if (!draft) {
              throw new NotFoundError(`Draft for "${nftItemDraftId}" id is not found`);
            }
            if (draft.status != NftItemMetadataDraftStatus.IN_PROGRESS) {
              throw new BadRequestError(`Draft "${nftItemDraftId}" is locked for updates`);
            }

            const username = ctx.state.user.username;

            if (draft.ownedByTeam) {
              const isAuthorized = await teamDtoService.authorizeTeamAccount(draft.owner, username)
              if (!isAuthorized) {
                throw new ForbiddenError(`"${username}" is not permitted to edit "${draft.nftCollectionId}" nft collection`);
              }
            } else if (draft.owner !== username) {
              throw new ForbiddenError(`"${username}" is not permitted to edit "${draft.nftCollectionId}" nft collection`);
            }

            if (draft.status == NftItemMetadataDraftStatus.PROPOSED) {
              throw new ConflictError(`Content with hash ${draft.hash} has been proposed already and cannot be deleted`);
            }
          };

          const updateNFTItemMetadataDraftSettings = {
            cmdNum: APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT,
            validate: validateUpdateNFTItemMetadataDraft
          };

          const validCmdsOrder = [updateNFTItemMetadataDraftSettings];

          await this.validateCmds(appCmds, validCmdsOrder);
        };

        const msg = ctx.state.msg;

        await assetCmdHandler.process(msg, ctx, validate);

        const nftItemDraftId = this.extractEntityId(msg, APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT, '_id');

        ctx.successRes({
          _id: nftItemDraftId
        });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  deleteNFTItemMetadataDraft = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const validateDeleteNFTItemMetadataDraft = async (deleteNFTItemMetadataDraftCmd, cmdStack) => {
            const { _id } = deleteNFTItemMetadataDraftCmd.getCmdPayload();
            const draft = await nftItemMetadataDraftService.getNFTItemMetadataDraft(_id);
            if (!draft) {
              throw new NotFoundError(`Draft for "${_id}" id is not found`);
            }

            const user = await userService.getUser(draft.owner);
            const username = ctx.state.user.username;

            if (user) {
              if (user._id !== username) {
                throw new ForbiddenError(`"${username}" is not permitted to edit "${draft.nftCollectionId}" nft collection`);
              }
            } else {
              const isAuthorized = await teamDtoService.authorizeTeamAccount(draft.owner, username)
              if (!isAuthorized) {
                throw new ForbiddenError(`"${username}" is not permitted to edit "${draft.nftCollectionId}" nft collection`);
              }
            }

            // if there is a proposal for this content (no matter is it approved or still in voting progress)
            // we must respond with an error as blockchain hashed data should not be modified
            if (draft.status == NftItemMetadataDraftStatus.PROPOSED) {
              throw new ConflictError(`Content with hash ${draft.hash} has been proposed already and cannot be deleted`);
            }
          };

          const deleteNFTItemMetadataDraftSettings = {
            cmdNum: APP_CMD.DELETE_NFT_ITEM_METADATA_DRAFT,
            validate: validateDeleteNFTItemMetadataDraft
          };

          const validCmdsOrder = [deleteNFTItemMetadataDraftSettings];

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

  createNFTCollection = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const validateCreateNFTCollection = async (createNFTCollectionCmd, cmdStack) => {
            const { issuedByTeam, issuer } = createNFTCollectionCmd.getCmdPayload();
            const username = ctx.state.user.username;

            if (issuedByTeam) {
              const isAuthorized = await teamDtoService.authorizeTeamAccount(issuer, username)
              if (!isAuthorized) {
                throw new ForbiddenError(`"${username}" is not permitted to create nft collection`);
              }
            } else if (issuer !== username) {
              throw new BadRequestError(`Can't create nft collection for other accounts`);
            }
          };

          const createNFTCollectionSettings = {
            cmdNum: APP_CMD.CREATE_NFT_COLLECTION,
            validate: validateCreateNFTCollection
          };

          const validCmdsOrder = [createNFTCollectionSettings];

          await this.validateCmds(appCmds, validCmdsOrder);
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

  createNFTCollectionMetadata = this.command({
    form: NFTCollectionForm,
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const validateCreateNFTCollectionMetadata = async (createNFTCollectionMetadataCmd, cmdStack) => {
            const { issuedByTeam, issuer } = createNFTCollectionMetadataCmd.getCmdPayload();
            const username = ctx.state.user.username;

            if (issuedByTeam) {
              const isAuthorized = await teamDtoService.authorizeTeamAccount(issuer, username)
              if (!isAuthorized) {
                throw new ForbiddenError(`"${username}" is not permitted to create nft collection`);
              }
            } else if (issuer !== username) {
              throw new BadRequestError(`Can't create nft collection for other accounts`);
            }
          };

          const createNFTCollectionMetadataSettings = {
            cmdNum: APP_CMD.CREATE_NFT_COLLECTION_METADATA,
            validate: validateCreateNFTCollectionMetadata
          };

          const validCmdsOrder = [createNFTCollectionMetadataSettings];

          await this.validateCmds(appCmds, validCmdsOrder);
        };

        const msg = ctx.state.msg;

        await assetCmdHandler.process(msg, ctx, validate);
        const entityId = this.extractEntityId(msg, APP_CMD.CREATE_NFT_COLLECTION_METADATA);
        ctx.successRes({ _id: String(entityId) });
      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });


  updateNFTCollectionMetadata = this.command({
    form: NFTCollectionForm,
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const validateUpdateNFTCollectionMetadata = async (updateNFTCollectionMetadataCmd, cmdStack) => {
            const { _id: nftCollectionId } = updateNFTCollectionMetadataCmd.getCmdPayload();
            const nftCollectionMetadata = await nftCollectionMetadataService.getNFTCollectionMetadata(nftCollectionId);
            if (!nftCollectionMetadata) {
              throw new BadRequestError(`Nft collection "${nftCollectionId}" doesn't exist`);
            }
            const username = ctx.state.user.username;

            if (nftCollectionMetadata.issuedByTeam) {
              const isAuthorized = await teamDtoService.authorizeTeamAccount(nftCollectionMetadata.issuer, username)
              if (!isAuthorized) {
                throw new ForbiddenError(`"${username}" is not permitted to edit "${nftCollectionId}" nft collection`);
              }
            } else if (nftCollectionMetadata.issuer !== username) {
              throw new ForbiddenError(`"${username}" is not permitted to edit "${nftCollectionId}" nft collection`);
            }
          };

          const updateNFTCollectionMetadataSettings = {
            cmdNum: APP_CMD.UPDATE_NFT_COLLECTION_METADATA,
            validate: validateUpdateNFTCollectionMetadata
          };

          const validCmdsOrder = [updateNFTCollectionMetadataSettings];

          await this.validateCmds(appCmds, validCmdsOrder);
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);

        const entityId = this.extractEntityId(msg, APP_CMD.UPDATE_NFT_COLLECTION_METADATA, '_id');

        ctx.successRes({ _id: String(entityId) });

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

  moderateNFTItemMetadataDraft = this.command({
    h: async (ctx) => {
      try {

        let newStatus;
        let draftId;
        const validate = async (appCmds) => {
          const appCmd = appCmds.find((cmd) => cmd.getCmdNum() == APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_STATUS);
            if (!appCmd) {
              throw new BadRequestError(`'APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_STATUS' is not found`);
            }

            newStatus = appCmd.getCmdPayload().status;
            draftId = appCmd.getCmdPayload()._id;

            if (newStatus != NftItemMetadataDraftStatus.APPROVED && newStatus != NftItemMetadataDraftStatus.REJECTED) {
              throw new BadRequestError(`Unrecognized status provided`);
            }
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);
        // after separate cmd validation all appCmds should have draft _id in payload
        ctx.successRes({
          _id: draftId
        });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  })
}


const assetsCtrl = new AssetsController();


module.exports = assetsCtrl;