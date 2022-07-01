import { ChainService } from '@deip/chain-service';
import { AcceptProposalCmd, DeclineProposalCmd } from '@deip/commands';
import { 
  APP_CMD,
  NftItemMetadataDraftStatus,
  NFT_ITEM_METADATA_FORMAT
 } from '@casimir/platform-core';
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
  NFTItemMetadataService,
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
const nftItemMetadataService = new NFTItemMetadataService();
const assetDtoService = new AssetDtoService();
const userDtoService = new UserDtoService();
const ftClassDtoService = new FTClassDtoService();
const nftCollectionDtoService = new NFTCollectionDtoService();
const nftItemDtoService = new NFTItemDtoService();
const userService = new UserService();
const proposalDtoService = new ProposalDtoService();

class AssetsController extends BaseController {

  getAccountDepositHistory = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const status = query.status;
        const account = ctx.params.account;
        const username = ctx.state.user.username;
        if (account != username) {
          const users = await userDtoService.getUsersByTeam(account);
          if (!users.find(u => u.username == username)) {
            throw new ForbiddenError(`You have no permission to get info about '${account}' account or ${account} doesn't exist`);
          }
        }
        const history = await assetDtoService.getAccountDepositHistory(account, status);
        ctx.successRes(history);
      }
      catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


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


  getNFTItem = this.query({
    h: async (ctx) => {
      try {
        const nftCollectionId = ctx.params.nftCollectionId;
        const nftItemId = ctx.params.nftItemId;
        const nftItem = await nftItemDtoService.getNFTItem({ nftItemId, nftCollectionId });
        if (!nftItem) {
          throw new NotFoundError(`NFTItem "${nftItemId}" in ${nftCollectionId} nft collection is not found`);
        }
        ctx.successRes(nftItem);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNFTItemsByNFTCollection = this.query({
    h: async (ctx) => {
      try {
        const nftCollectionId = ctx.params.nftCollectionId;
        const nftCollection = await nftCollectionMetadataService.getNFTCollectionMetadata(nftCollectionId);

        if (!nftCollection) {
          throw new NotFoundError(`NftCollection "${nftCollectionId}" is not found`);
        }

        const nftItems = await nftItemDtoService.getNFTItemsByNFTCollection(nftCollectionId);

        ctx.successRes(nftItems);
      } catch (err) {
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

  getPublicNFTItemsListing = this.query({
    h: async (ctx) => {
      try {
        const nftItems = await nftItemDtoService.lookupNFTItems();
        const nftItemsIds = nftItems.reduce((acc, nftItem) => {
          if (!acc.some(nftCollectionId => nftCollectionId == nftItem.nftCollectionId)) {
            acc.push(nftItem.nftCollectionId);
          }
          return acc;
        }, []);

        const nftCollections = await nftCollectionDtoService.getNFTCollections(nftItemsIds);
        const publicNftCollectionsIds = nftCollections.filter(r => !r.isPrivate).map(r => r._id);
        const result = nftItems.filter(nftItem => publicNftCollectionsIds.some(id => id == nftItem.nftCollectionId))

        ctx.successRes(result);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNFTItemsListingPaginated = this.query({
    h: async (ctx) => {
      try {
        const { filter = {}, sort, page, pageSize } = qs.parse(ctx.query);
        const {
          paginationMeta,
          result: nftItems
        } = await nftItemDtoService.lookupNFTItemsWithPagination(filter, sort, { page, pageSize });

        ctx.successRes(nftItems, { extraInfo: paginationMeta });
      } catch (err) {
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
        } = await nftItemMetadataDraftService.lookupNFTItemMetadataDraftsWithPagination(filter, sort, { page, pageSize });

        ctx.successRes(result, { extraInfo: paginationMeta });
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNFTItemPackageFile = this.query({
    h: async (ctx) => {
      try {
        const nftCollectionId = ctx.params.nftCollectionId;
        const nftItemId = ctx.params.nftItemId;
        const fileHash = ctx.params.fileHash;
        const isDownload = ctx.query.download === 'true';

        const dirPathData = {
          nftCollectionId: '',
          packageFiles: '',
          folder: ''
        };
        const nftItemMetadata = await nftItemMetadataService.getNFTItemMetadata({ nftItemId, nftCollectionId });

        if (!nftItemMetadata) {
          const draft = await nftItemMetadataDraftService.getNFTItemMetadataDraft(nftItemId);
          if (!draft) {
            throw new NotFoundError(`Package for "${nftItemId}" id is not found`);
          }
          dirPathData.nftCollectionId = draft.nftCollectionId
          dirPathData.folder = draft.folder
          dirPathData.packageFiles = draft.packageFiles
        } else {
          dirPathData.nftCollectionId = nftItemMetadata.nftCollectionId
          dirPathData.folder = nftItemMetadata.folder
          dirPathData.packageFiles = nftItemMetadata.packageFiles
        }

        const file = dirPathData.packageFiles.find(f => f.hash == fileHash);
        if (!file) {
          throw new NotFoundError(`File "${fileHash}" is not found`);
        }

        const filename = file.filename;
        const filepath = FileStorage.getNFTItemMetadataPackageFilePath(dirPathData.nftCollectionId, dirPathData.folder, filename);
        const ext = filename.substr(filename.lastIndexOf('.') + 1);
        const name = filename.substr(0, filename.lastIndexOf('.'));
        const isImage = ['png', 'jpeg', 'jpg'].some(e => e == ext);
        const isPdf = ['pdf'].some(e => e == ext);

        if (isDownload) {
          ctx.response.set('content-disposition', `attachment; filename="${slug(name)}.${ext}"`);
        } else if (isImage) {
          ctx.response.set('content-type', `image/${ext}`);
          ctx.response.set('content-disposition', `inline; filename="${slug(name)}.${ext}"`);
        } else if (isPdf) {
          ctx.response.set('content-type', `application/${ext}`);
          ctx.response.set('content-disposition', `inline; filename="${slug(name)}.${ext}"`);
        } else {
          ctx.response.set('content-disposition', `attachment; filename="${slug(name)}.${ext}"`);
        }

        const fileExists = await FileStorage.exists(filepath);
        if (!fileExists) {
          throw new NotFoundError(`${filepath} is not found`);
        }

        const buff = await FileStorage.get(filepath);
        ctx.successRes(buff, { withoutWrap: true });
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNFTItemMetadataDraftsByNFTCollection = this.query({
    h: async (ctx) => {
      try {

        const nftCollectionId = ctx.params.nftCollectionId;
        const result = await nftItemMetadataDraftService.getNFTItemMetadataDraftsByNFTCollection(nftCollectionId);
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

  createNFTItemMetadata = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_NFT_ITEM_METADATA);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          const { nftItemMetadataDraftId, nftCollectionId } = appCmd.getCmdPayload();
          const username = ctx.state.user.username;

          const nftCollection = await nftCollectionMetadataService.getNFTCollectionMetadata(nftCollectionId);

          if (!nftCollection) {
            throw new BadRequestError(`Nft collection ${nftCollectionId} doesn't exist`);
          }

          if (nftCollection.issuedByTeam) {
            const isAuthorized = await teamDtoService.authorizeTeamAccount(nftCollection.issuer, username)
            if (!isAuthorized) {
              throw new ForbiddenError(`"${username}" is not permitted to create nft item metadata for "${nftCollectionId}" nft collection`);
            }
          } else if (nftCollection.issuer !== username) {
            throw new ForbiddenError(`"${username}" is not permitted to create nft item metadata for "${nftCollectionId}" nft collection`);
          }

          const draft = await nftItemMetadataDraftService.getNFTItemMetadataDraft(nftItemMetadataDraftId);

          if (!draft) {
            throw new NotFoundError(`Draft with "${nftItemMetadataDraftId}" id is not found`);
          }
          const nftItemMetadata = await nftItemMetadataService.findNFTItemMetadataByHash(draft.nftCollectionId, draft.hash);

          if (nftItemMetadata) {
            throw new ConflictError(`Nft item metadata with "${draft.hash}" hash already exist`);
          }

          const moderationRequired = ctx.state.portal.settings.moderation.nftItemMetadataDraftModerationRequired;
          if (
            moderationRequired &&
            draft.status != NftItemMetadataDraftStatus.APPROVED
          ) {
            throw new BadRequestError(`Nft item metadata "${draft.nftCollectionId}" isn't in 'Approved' status`);
          }
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);
        const entityId = this.extractEntityId(msg, APP_CMD.CREATE_NFT_ITEM_METADATA);
        ctx.successRes({ _id: String(entityId) });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  createNFTItemMetadataDraft = this.command({
    form: NFTItemMetadataForm, h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_NFT_ITEM_METADATA_DRAFT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          const { nftCollectionId, owner, ownedByTeam } = appCmd.getCmdPayload();
          const nftCollection = await nftCollectionMetadataService.getNFTCollectionMetadata(nftCollectionId);

          if (!nftCollection) {
            throw new BadRequestError(`Nft collection "${nftCollectionId}" doesn't exist`);
          }

          const username = ctx.state.user.username;

          if (nftCollection.issuedByTeam) {
            if (ownedByTeam && owner !== nftCollection.issuer) {
              throw new BadRequestError(`Can't create nft item metadata draft by other team for team nft collection`);
            }
            const isAuthorized = await teamDtoService.authorizeTeamAccount(nftCollection.issuer, username)
            if (!isAuthorized) {
              throw new ForbiddenError(`"${username}" is not permitted to create nft item metadata draft`);
            }
          } else {
            if (ownedByTeam) {
              throw new BadRequestError(`Can't create nft item metadata draft by team for user nft collection`);
            }
            if (nftCollection.issuer !== owner || owner !== username) {
              throw new ForbiddenError(`"${username}" is not permitted to create nft collection metadata draft`);
            }
          }
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
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }

          const { _id: nftItemDraftId } = appCmd.getCmdPayload();

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

          if (draft.formatType === NFT_ITEM_METADATA_FORMAT.PACKAGE) {
            const archiveDir = FileStorage.getNFTCollectionArchiveDirPath(draft.nftCollectionId, draft.folder);
            const exists = await FileStorage.exists(archiveDir);
            if (!exists) {
              throw new NotFoundError(`Dir "${archiveDir}" is not found`);
            }
          }
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
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.DELETE_NFT_ITEM_METADATA_DRAFT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts app cmd`);
          }

          const { _id } = appCmd.getCmdPayload();
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

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  uploadNFTItemMetadataPackage = this.command({
    form: NFTItemMetadataForm, h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_NFT_ITEM_METADATA_DRAFT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
        };


        const msg = ctx.state.msg;

        await assetCmdHandler.process(msg, ctx, validate);

        const nftItemDraftId = this.extractEntityId(msg, APP_CMD.CREATE_NFT_ITEM_METADATA_DRAFT, '_id');

        ctx.successRes({
          _id: nftItemDraftId
        });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  createFTTransferRequest = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.TRANSFER_FT || cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();
            if (!proposedCmds.some(cmd => cmd.getCmdNum() === APP_CMD.TRANSFER_FT)) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.TRANSFER_FT]} protocol cmd`);
            }
          }
        };

        const msg = ctx.state.msg;

        await assetCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  createNFTTransferRequest = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.TRANSFER_NFT || cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();
            if (!proposedCmds.some(cmd => cmd.getCmdNum() === APP_CMD.TRANSFER_NFT)) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.TRANSFER_NFT]} protocol cmd`);
            }
          }
        };

        const msg = ctx.state.msg;

        await assetCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  createTokenSwapRequest = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          if (appCmd.getCmdNum() === APP_CMD.CREATE_PROPOSAL) {
            const proposedCmds = appCmd.getProposedCmds();
            if (!proposedCmds.some(cmd => cmd.getCmdNum() === APP_CMD.TRANSFER_FT || cmd.getCmdNum() === APP_CMD.TRANSFER_NFT)) {
              throw new BadRequestError(`Proposal must contain ${APP_CMD[APP_CMD.TRANSFER_FT]} or ${APP_CMD[APP_CMD.TRANSFER_NFT]} protocol cmd`);
            }
          }
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);

        ctx.successRes();

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });


  createNFTLazySellProposal = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          if (appCmds.length !== 2) throw new BadRequestError(`This endpoint accepts only lazySell proposal`);

          const [proposalCmd, acceptProposalCmd] = appCmds;
          if (proposalCmd.getCmdNum() !== APP_CMD.CREATE_PROPOSAL)
            throw new BadRequestError(`Wrong cmd order`);

          if (acceptProposalCmd.getCmdNum() !== APP_CMD.ACCEPT_PROPOSAL)
            throw new BadRequestError(`Wrong cmd order`);

          const proposedCmds = proposalCmd.getProposedCmds();
          if (proposedCmds.length !== 2) throw new BadRequestError(`This endpoint accepts only lazySell proposal`);
          const [transferFtCmd, createNFTItemCmd] = proposedCmds;

          if (
            transferFtCmd.getCmdNum() !== APP_CMD.TRANSFER_FT ||
            createNFTItemCmd.getCmdNum() !== APP_CMD.CREATE_NFT_ITEM
          ) throw new BadRequestError(`Wrong cmd order`);

          const { from, to, amount, tokenId } = transferFtCmd.getCmdPayload();

          if (from !== config.TENANT_HOT_WALLET.daoId)
            throw new BadRequestError(`TransferFtCmd wrong params`);

          const { issuer, recipient, classId, instanceId } = createNFTItemCmd.getCmdPayload();

          if (recipient !== config.TENANT_HOT_WALLET.daoId)
            throw new BadRequestError(`IssueNftCmd wrong params`);

          //TODO: check that classId belongs to isser and draft exists 

        };

        const msg = ctx.state.msg;

        await assetCmdHandler.process(msg, ctx, validate);

        const entityId = this.extractEntityId(msg, APP_CMD.CREATE_PROPOSAL);

        ctx.successRes({ entityId: String(entityId) });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  createNFTLazyBuyProposal = this.command({
    h: async (ctx) => {
      try {

        const chainService = await ChainService.getInstanceAsync(config);
        const chainNodeClient = chainService.getChainNodeClient();
        const chainTxBuilder = chainService.getChainTxBuilder();


        const validate = async (appCmds) => {
          // if (appCmds.length !== 3) throw new BadRequestError(`This endpoint accepts only lazyBuy proposal`);

          const [proposalCmd, acceptRootProposalCmd] = appCmds;
          if (
            proposalCmd.getCmdNum() !== APP_CMD.CREATE_PROPOSAL ||
            acceptRootProposalCmd.getCmdNum() !== APP_CMD.ACCEPT_PROPOSAL
          ) throw new BadRequestError(`Wrong cmd order`);


          const proposedCmds = proposalCmd.getProposedCmds();
          if (proposedCmds.length !== 3) throw new BadRequestError(`This endpoint accepts only lazyBuy proposal`);

          const [transferFtCmd, acceptProposalCmd, transferNftCmd] = proposedCmds;

          if (
            transferFtCmd.getCmdNum() !== APP_CMD.TRANSFER_FT ||
            acceptProposalCmd.getCmdNum() !== APP_CMD.ACCEPT_PROPOSAL ||
            transferNftCmd.getCmdNum() !== APP_CMD.TRANSFER_NFT
          ) throw new BadRequestError(`Wrong cmd order`);

          //TODO: validate proposal inner cmds

        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);

        if (config.TENANT_HOT_WALLET) {
          // Lazy buy hot wallet sign flow
          const lazyBuyProposalId = this.extractEntityId(msg, APP_CMD.CREATE_PROPOSAL);
          const appCmdAcceptProposal = msg.appCmds.find(x => x.getCmdNum() === APP_CMD.ACCEPT_PROPOSAL);
          const { batchWeight } = appCmdAcceptProposal.getCmdPayload();

          const { daoId: hotWalletDaoId, privKey: hotWalletPrivKey } = config.TENANT_HOT_WALLET;

          const acceptProposalTx = await chainTxBuilder.begin()
            .then((txBuilder) => {
              const acceptLazyBuyProposalCmd = new AcceptProposalCmd({
                entityId: lazyBuyProposalId,
                account: hotWalletDaoId,
                batchWeight
              });
              txBuilder.addCmd(acceptLazyBuyProposalCmd);

              return txBuilder.end();
            })
            .then((acceptTx) => acceptTx.signAsync(hotWalletPrivKey, chainNodeClient))

          await assetCmdHandler.process(acceptProposalTx.getPayload(), ctx);
        }
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
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_FT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
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
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_NFT_COLLECTION);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          const { issuedByTeam, issuer } = appCmd.getCmdPayload();
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
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_NFT_COLLECTION_METADATA);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          const { issuedByTeam, issuer } = appCmd.getCmdPayload();
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
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_NFT_COLLECTION_METADATA);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }

          const { _id: nftCollectionId } = appCmd.getCmdPayload();
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

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);

        const entityId = this.extractEntityId(msg, APP_CMD.UPDATE_NFT_COLLECTION_METADATA, '_id');

        ctx.successRes({ _id: String(entityId) });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  //needed?? createNFTItem
  issueFt = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.ISSUE_FT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
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

  createNFTItem = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_NFT_ITEM);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          const {
            nftCollectionId,
            nftItemId
          } = appCmd.getCmdPayload();

          const nftCollection = await nftCollectionMetadataService.getNFTCollectionMetadata(nftCollectionId);

          if (!nftCollection) {
            throw new BadRequestError(`Nft collection ${nftCollectionId} doesn't exist`);
          }

          const username = ctx.state.user.username;

          if (nftCollection.issuedByTeam) {
            const isAuthorized = await teamDtoService.authorizeTeamAccount(nftCollection.issuer, username)
            if (!isAuthorized) {
              throw new ForbiddenError(`"${username}" is not permitted to create nft item for "${nftCollectionId}" nft collection`);
            }
          } else if (nftCollection.issuer !== username) {
            throw new ForbiddenError(`"${username}" is not permitted to create nft item for "${nftCollectionId}" nft collection`);
          }

          const instance = await nftItemDtoService.getNFTItemsByOwnerAndNFTCollection(ctx.state.user.username, nftCollectionId);
          if (instance.nftItemsIds.includes(nftItemId)) {
            throw new ConflictError(`nftItemId ${nftItemId} already exist`);
          }
          if (nftItemId == 0) {
            throw new BadRequestError(`nftItemId cant not be 0`);
          }
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);
        const entityId = this.extractEntityId(msg, APP_CMD.CREATE_NFT_ITEM);
        ctx.successRes({ _id: String(entityId) });

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  moderateNFTItemMetadataDraft = this.command({
    h: async (ctx) => {
      try {
        const chainService = await ChainService.getInstanceAsync(config);
        const chainNodeClient = chainService.getChainNodeClient();
        const chainTxBuilder = chainService.getChainTxBuilder();

        const validate = async (appCmds) => {
          const validCmds = [APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_STATUS, APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_MODERATION_MSG];
          const appCmd = appCmds.find(cmd => validCmds.includes(cmd.getCmdNum()));
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }

          const { IN_PROGRESS, PROPOSED, REJECTED, APPROVED } = NftItemMetadataDraftStatus;
          const jwtUsername = ctx.state.user.username;
          const moderators = ctx.state.portal.profile.settings.moderation.moderators || [];
          const isModerator = moderators.includes(jwtUsername);
          const { _id: draftId } = appCmd.getCmdPayload();
          const draft = await nftItemMetadataDraftService.getNFTItemMetadataDraft(draftId);
          if (!draft)
            throw new NotFoundError(`Draft for "${draftId}" id is not found`);

          const isAuthorized = await teamDtoService.authorizeTeamAccount(draft?.owner, jwtUsername);

          if (!isAuthorized && !isModerator)
            throw new ForbiddenError(`"${jwtUsername}" is not permitted to edit "${draftId}" draft`);

          if (appCmd.getCmdNum() === APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_STATUS) {
            const { status } = appCmd.getCmdPayload();

            if (!Object.values(NftItemMetadataDraftStatus).includes(status))
              throw new BadRequestError(`This endpoint accepts only nft item metadata draft status`)

            if (draft.status === IN_PROGRESS) {
              //user can change status from IN_PROGRESS to PROPOSED
              if (!isAuthorized)
                throw new ForbiddenError(`"${jwtUsername}" is not permitted to edit status`);
              if (status !== PROPOSED)
                throw new BadRequestError("Bad status");
            }

            if (draft.status === PROPOSED) {
              //moderator can change status to APPROVED or REJECTED
              if (!isModerator)
                throw new ForbiddenError(`"${jwtUsername}" is not permitted to edit status`);
              if (status !== APPROVED && status !== REJECTED)
                throw new BadRequestError("Bad status");
            }

            if (draft.status === APPROVED) {
              //moderator can change status from APPROVED to REJECTED
              if (!isModerator)
                throw new ForbiddenError(`"${jwtUsername}" is not permitted to edit status`);
              if (status !== REJECTED)
                throw new BadRequestError("Bad status");
            }

            if (draft.status === REJECTED) {
              //moderator can change status from REJECTED to APPROVED
              //user can change status from REJECTED to IN_PROGRESS
              if (isModerator && status !== APPROVED)
                throw new BadRequestError("Bad status");
              if (isAuthorized && status !== IN_PROGRESS)
                throw new BadRequestError("Bad status");
            }
          }

          if (appCmd.getCmdNum() === APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_MODERATION_MSG) {
            //moderator can change message if status is PROPOSED
            if (!isModerator)
              throw new ForbiddenError(`"${jwtUsername}" is not permitted to edit moderation message`);
            if (draft.status !== PROPOSED)
              throw new BadRequestError("Bad status");
          }
        };
        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);


        const changeStatusCmd = msg.appCmds.find(x => x.getCmdNum() === APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_STATUS);
        if (
          changeStatusCmd &&
          changeStatusCmd.getCmdPayload().status == NFT_ITEM_METADATA_DRAFT_STATUS.REJECTED &&
          config.TENANT_HOT_WALLET
        ) {
          // Lazy sell proposal decline flow
          const { _id: draftId } = changeStatusCmd.getCmdPayload();

          const nftItemDraft = await nftItemMetadataDraftService.getNFTItemMetadataDraft(draftId);

          // findOne because mapProposal is not working correctly
          const lazySellProposal = await proposalDtoService.findOne({ _id: nftItemDraft.lazySellProposalId });
          const { batchWeight } = lazySellProposal;
          const { daoId: hotWalletDaoId, privKey: hotWalletPrivKey } = config.TENANT_HOT_WALLET;

          const declineProposalTx = await chainTxBuilder.begin()
            .then((txBuilder) => {
              const declineLazySellProposalCmd = new DeclineProposalCmd({
                entityId: nftItemDraft.lazySellProposalId,
                account: hotWalletDaoId,
                batchWeight
              });
              txBuilder.addCmd(declineLazySellProposalCmd);

              return txBuilder.end();
            })
            .then((acceptTx) => acceptTx.signAsync(hotWalletPrivKey, chainNodeClient))

          await assetCmdHandler.process(declineProposalTx.getPayload(), ctx);
        }

        //after separate cmd validation all appCmds should have draft _id in payload
        const draftId = this.extractEntityId(msg, msg.appCmds[0].getCmdNum(), '_id');

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