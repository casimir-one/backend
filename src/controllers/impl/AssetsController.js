import BaseController from '../base/BaseController';
import { APP_CMD, PROJECT_CONTENT_FORMAT, PROJECT_CONTENT_DRAFT_STATUS } from '@deip/constants';
import qs from 'qs';
import slug from 'limax';
import mongoose from 'mongoose';
import { BadRequestError, ForbiddenError, NotFoundError, ConflictError } from './../../errors';
import {
  AssetDtoService,
  UserDtoService,
  FungibleTokenDtoService,
  NftItemMetadataDraftService,
  NftItemDtoService,
  NftItemMetadataService,
  NftCollectionDtoService,
  NftCollectionMetadataService,
  TeamDtoService,
  UserService
} from '../../services';
import { assetCmdHandler } from './../../command-handlers';
import { ProjectContentPackageForm, ProjectForm } from '../../forms';
import readArchive from './../../dar/readArchive';
import FileStorage from './../../storage';


const nftCollectionMetadataService = new NftCollectionMetadataService();
const teamDtoService = new TeamDtoService();
const nftItemMetadataDraftService = new NftItemMetadataDraftService();
const nftItemMetadataService = new NftItemMetadataService();
const assetDtoService = new AssetDtoService();
const userDtoService = new UserDtoService();
const fungibleTokenDtoService = new FungibleTokenDtoService();
const nftCollectionDtoService = new NftCollectionDtoService();
const nftItemDtoService = new NftItemDtoService();
const userService = new UserService();

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
      catch(err) {
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
      catch(err) {
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
      catch(err) {
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
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  
  getFungibleTokenById = this.query({
    h: async (ctx) => {
      try {
        const assetId = ctx.params.assetId;
        const asset = await fungibleTokenDtoService.getFungibleTokenById(assetId);
        if (!asset) {
          throw new NotFoundError(`Asset "${assetId}" is not found`);
        }
        ctx.successRes(asset);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getFungibleTokenBySymbol = this.query({
    h: async (ctx) => {
      try {
        const symbol = ctx.params.symbol;
        const assets = await fungibleTokenDtoService.getFungibleTokenBySymbol(symbol);
        if (!assets) {
          throw new NotFoundError(`Asset "${symbol}" is not found`);
        }
        ctx.successRes(assets);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  
  getFungibleTokensByIssuer = this.query({
    h: async (ctx) => {
      try {
        const issuer = ctx.params.issuer;
        const assets = await fungibleTokenDtoService.getFungibleTokensByIssuer(issuer);
        ctx.successRes(assets);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });
  

  lookupFungibleTokens = this.query({
    h: async (ctx) => {
      try {
        const { lowerBoundSymbol, limit } = ctx.params;
        const assets = await fungibleTokenDtoService.lookupFungibleTokens(lowerBoundSymbol, limit);
        ctx.successRes(assets);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });
  

  getFungibleTokenBalance = this.query({
    h: async (ctx) => {
      try {
        const { owner, symbol } = ctx.params;
        const asset = await fungibleTokenDtoService.getFungibleTokenBalance(owner, symbol);
        if (!asset) {
          throw new NotFoundError(`Asset "${symbol}" is not found`);
        }
        ctx.successRes(asset);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });
  

  getFungibleTokenBalancesByOwner = this.query({
    h: async (ctx) => {
      try {
        const owner = ctx.params.owner;
        const asset = await fungibleTokenDtoService.getFungibleTokenBalancesByOwner(owner);
        ctx.successRes(asset);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });
  

  getFungibleTokenBalancesBySymbol = this.query({
    h: async (ctx) => {
      try {
        const symbol = ctx.params.symbol;
        const assets = await fungibleTokenDtoService.getFungibleTokenBalancesBySymbol(symbol);
        ctx.successRes(assets);
      }
      catch(err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getNftCollection = this.query({
    h: async (ctx) => {
      try {
        const nftCollectionId = ctx.params.nftCollectionId;
        const nftCollection = await nftCollectionDtoService.getNftCollection(nftCollectionId);
        if (!nftCollection) {
          throw new NotFoundError(`NftCollection "${nftCollectionId}" id is not found`);
        }
        ctx.successRes(nftCollection);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getDefaultNftCollection = this.query({
    h: async (ctx) => {
      try {
        const issuer = ctx.params.issuer;
        const result = await nftCollectionDtoService.getDefaultNftCollection(issuer);
        ctx.successRes(result);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNftCollections = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const nftCollectionsIds = query.nftCollectionsIds;
        if (!Array.isArray(nftCollectionsIds)) {
          throw new BadRequestError(`nftCollectionsIds must be an array of ids`);
        }

        const result = await nftCollectionDtoService.getNftCollections(nftCollectionsIds);
        ctx.successRes(result);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getPublicNftCollectionsListing = this.query({
    h: async (ctx) => {
      try {
        const query = qs.parse(ctx.query);
        const filter = query.filter;
        const result = await nftCollectionDtoService.lookupNftCollections(filter);
        ctx.successRes(result.filter(r => !r.isPrivate));
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }

    }
  });

  getNftCollectionsByIssuer = this.query({
    h: async (ctx) => {
      try {
        const jwtUsername = ctx.state.user.username;
        const issuer = ctx.params.issuer;
        const result = await nftCollectionDtoService.getNftCollectionsByIssuer(issuer);
        ctx.successRes(result.filter(r => !r.isPrivate || r.members.some(m => m == jwtUsername)));
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }

    }
  });

  getNftCollectionsByPortal = this.query({
    h: async (ctx) => {
      try {
        const portalId = ctx.state.portal.id;
        const result = await nftCollectionDtoService.getNftCollectionsByPortal(portalId);
        ctx.successRes(result.filter(r => !r.isPrivate));
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });


  getNftItem = this.query({
    h: async (ctx) => {
      try {
        const nftCollectionId = ctx.params.nftCollectionId;
        const nftItem = await nftItemDtoService.getNftItem(nftCollectionId);
        if (!nftItem) {
          throw new NotFoundError(`NftItem "${nftCollectionId}" is not found`);
        }
        ctx.successRes(nftItem);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNftItemsByNftCollection = this.query({
    h: async (ctx) => {
      try {
        const nftCollectionId = ctx.params.nftCollectionId;
        const nftCollection = await nftCollectionMetadataService.getNftCollectionMetadata(nftCollectionId);
        if (!nftCollection) {
          throw new NotFoundError(`NftCollection "${nftCollectionId}" is not found`);
        }

        const nftItems = await nftItemDtoService.getNftItemsByNftCollection(nftCollectionId);

        const result = nftItems.map(pc => ({ ...pc, isDraft: false }))

        ctx.successRes(result);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNftItemsByPortal = this.query({
    h: async (ctx) => {
      try {
        const portalId = ctx.params.portalId;
        const result = await nftItemDtoService.getNftItemsByPortal(portalId)
        ctx.successRes(result);
      } catch (err) {
        console.log(err);
        ctx.errorRes(err);
      }
    }
  });

  getPublicNftItemsListing = this.query({
    h: async (ctx) => {
      try {
        const nftItems = await nftItemDtoService.lookupNftItems();
        const nftItemsIds = nftItems.reduce((acc, nftItem) => {
          if (!acc.some(nftCollectionId => nftCollectionId == nftItem.nftCollectionId)) {
            acc.push(nftItem.nftCollectionId);
          }
          return acc;
        }, []);

        const nftCollections = await nftCollectionDtoService.getNftCollections(nftItemsIds);
        const publicNftCollectionsIds = nftCollections.filter(r => !r.isPrivate).map(r => r._id);
        const result = nftItems.filter(nftItem => publicNftCollectionsIds.some(id => id == nftItem.nftCollectionId))

        ctx.successRes(result);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNftItemsListingPaginated = this.query({
    h: async (ctx) => {
      try {
        const { filter = {}, sort, page, pageSize } = qs.parse(ctx.query);
        const {
          paginationMeta,
          result: nftItems
        } = await nftItemDtoService.lookupNftItemsWithPagination(filter, sort, { page, pageSize });

        const onlyUniq = (value, index, self) => self.indexOf(value) === index;
        const nftCollectionMetadatasIds = nftItems.map(x => x.nftCollectionId).filter(onlyUniq)

        const nftCollections = await nftCollectionMetadataService.getNftCollectionMetadatas(nftCollectionMetadatasIds);
        const publicNftCollectionsIds = nftCollections.filter(r => !r.isPrivate).map(r => r._id);

        const result = nftItems.filter(item => publicNftCollectionsIds.includes(item._id.nftCollectionId))

        ctx.successRes(result, { extraInfo: paginationMeta });
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNftItemsMetadataDraftsListingPaginated = this.query({
    h: async (ctx) => {
      try {
        const { filter = {}, sort, page, pageSize } = qs.parse(ctx.query);
        const {
          paginationMeta,
          result
        } = await nftItemMetadataDraftService.lookupNftItemMetadataDraftsWithPagination(filter, sort, { page, pageSize });

        ctx.successRes(result, { extraInfo: paginationMeta });
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNftItemDarArchiveStaticFiles = this.query({
    h: async (ctx) => {
      try {
        const nftItemId = ctx.params.nftItemId;
        const filename = ctx.params.file;
        const nftItemMetadata = await nftItemMetadataService.getNftItemMetadata(nftItemId);
        const filepath = FileStorage.getProjectDarArchiveFilePath(nftItemMetadata.nftCollectionId, nftItemMetadata.folder, filename);

        const buff = await FileStorage.get(filepath);
        const ext = filename.substr(filename.lastIndexOf('.') + 1);
        const name = filename.substr(0, filename.lastIndexOf('.'));
        const isImage = ['png', 'jpeg', 'jpg'].some(e => e == ext);
        const isPdf = ['pdf'].some(e => e == ext);

        if (isImage) {
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

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNftItemMetadata = this.query({
    h: async (ctx) => {
      try {
        const refId = ctx.params.refId;
        const nftItemMetadata = await nftItemMetadataService.getNftItemMetadata(refId);
        ctx.successRes(nftItemMetadata);
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNftItemPackageFile = this.query({
    h: async (ctx) => {
      try {
        const nftItemId = ctx.params.nftItemId;
        const fileHash = ctx.params.fileHash;
        const isDownload = ctx.query.download === 'true';

        const dirPathData = {
          nftCollectionId: '',
          packageFiles: '',
          folder: ''
        };

        const nftItemMetadata = await nftItemMetadataService.getNftItemMetadata(nftItemId);
        if (!nftItemMetadata) {
          const draft = await nftItemMetadataDraftService.getNftItemMetadataDraft(nftItemId);
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

        const nftCollection = await nftCollectionDtoService.getNftCollection(dirPathData.nftCollectionId);
        if (nftCollection.isPrivate) {
          const jwtUsername = ctx.state.user.username;
          const isAuthorized = await teamDtoService.authorizeTeamAccount(nftCollection.teamId, jwtUsername)
          if (!isAuthorized) {
            throw new ForbiddenError(`"${jwtUsername}" is not permitted to get "${nftCollection._id}" Nft item metadata`);
          }
        }

        const file = dirPathData.packageFiles.find(f => f.hash == fileHash);
        if (!file) {
          throw new NotFoundError(`File "${fileHash}" is not found`);
        }

        const filename = file.filename;
        const filepath = FileStorage.getProjectContentPackageFilePath(dirPathData.nftCollectionId, dirPathData.folder, filename);
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

  getNftItemDar = this.query({
    h: async (ctx) => {
      try {
        const nftItemId = ctx.params.nftItemId;
        const authorization = ctx.request.header['authorization'];
        const jwt = authorization.substring(authorization.indexOf("Bearer ") + "Bearer ".length, authorization.length);

        const dirPathData = {};
        const nftItemMetadata = await nftItemMetadataService.getNftItemMetadata(nftItemId);

        if (!nftItemMetadata) {
          const draft = await nftItemMetadataDraftService.getNftItemMetadataDraft(nftItemId);
          if (!draft) {
            throw new NotFoundError(`Dar for "${nftItemId}" id is not found`);
          }
          dirPathData.nftCollectionId = draft.nftCollectionId
          dirPathData.folder = draft.folder
        } else {
          dirPathData.nftCollectionId = nftItemMetadata.nftCollectionId
          dirPathData.folder = nftItemMetadata.folder
        }

        const archiveDir = FileStorage.getProjectDarArchiveDirPath(dirPathData.nftCollectionId, dirPathData.folder);
        const exists = await FileStorage.exists(archiveDir);

        if (!exists) {
          throw new NotFoundError(`Dar "${archiveDir}" is not found`);
        }

        const opts = {}
        const rawArchive = await readArchive(archiveDir, {
          noBinaryContent: true,
          ignoreDotFiles: true,
          versioning: opts.versioning
        })
        Object.keys(rawArchive.resources).forEach(recordPath => {
          const record = rawArchive.resources[recordPath]
          if (record._binary) {
            delete record._binary
            record.encoding = 'url'
            record.data = `${config.DEIP_SERVER_URL}/api/v2/nft-item/texture/${nftItemId}/assets/${record.path}?authorization=${jwt}`;
          }
        })
        ctx.successRes(rawArchive, { withoutWrap: true });
      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNftItemMetadataDraftsByNftCollection = this.query({
    h: async (ctx) => {
      try {

        const nftCollectionId = ctx.params.nftCollectionId;
        const result = await nftItemMetadataDraftService.getNftItemMetadataDraftsByNftCollection(nftCollectionId);
        ctx.successRes(result);

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  getNftItemMetadataDraft = this.query({
    h: async (ctx) => {
      try {

        const nftItemDraftId = ctx.params.nftItemDraftId;
        const result = await nftItemMetadataDraftService.getNftItemMetadataDraft(nftItemDraftId);
        ctx.successRes(result);

      } catch (err) {
        ctx.errorRes(err);
      }
    }
  });

  unlockDraft = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT);
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

  createNftItemMetadata = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_NFT_ITEM_METADATA);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
            const { nftItemMetadataDraftId, nftCollectionId } = appCmd.getCmdPayload();
            const username = ctx.state.user.username;

            const nftCollection = await nftCollectionMetadataService.getNftCollectionMetadata(nftCollectionId);

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

            const draft = await nftItemMetadataDraftService.getNftItemMetadataDraft(nftItemMetadataDraftId);

            if (!draft) {
              throw new NotFoundError(`Draft with "${nftItemMetadataDraftId}" id is not found`);
            }
            const nftItemMetadata = await nftItemMetadataService.findNftItemMetadataByHash(draft.nftCollectionId, draft.hash);

            if (nftItemMetadata) {
              throw new ConflictError(`Nft item metadata with "${draft.hash}" hash already exist`);
            }
            if (draft.status != PROJECT_CONTENT_DRAFT_STATUS.IN_PROGRESS) {
              throw new BadRequestError(`Nft item metadata "${draft.nftCollectionId}" is in '${draft.status}' status`);
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

  createNftItemMetadataDraft = this.command({
    form: ProjectContentPackageForm, h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.CREATE_NFT_ITEM_METADATA_DRAFT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }
          const { nftCollectionId, owner, ownedByTeam } = appCmd.getCmdPayload();
          const nftCollection = await nftCollectionMetadataService.getNftCollectionMetadata(nftCollectionId);

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

  updateNftItemMetadataDraft = this.command({
    form: ProjectContentPackageForm, h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }

          const { _id: nftItemDraftId } = appCmd.getCmdPayload();

          const draft = await nftItemMetadataDraftService.getNftItemMetadataDraft(nftItemDraftId);

          if (!draft) {
            throw new NotFoundError(`Draft for "${nftItemDraftId}" id is not found`);
          }
          if (draft.status != PROJECT_CONTENT_DRAFT_STATUS.IN_PROGRESS) {
            throw new BadRequestError(`Draft "${nftItemDraftId}" is locked for updates`);
          }

          const username = ctx.state.user.username;

          if (draft.ownedByTeam) {
            const isAuthorized = await teamDtoService.authorizeTeamAccount(draft.owner, username)
            if (!isAuthorized) {
              throw new ForbiddenError(`"${username}" is not permitted to edit "${nftCollectionId}" nft collection`);
            }
          } else if (draft.owner !== username) {
            throw new ForbiddenError(`"${username}" is not permitted to edit "${nftCollectionId}" nft collection`);
          }

          if (draft.status == PROJECT_CONTENT_DRAFT_STATUS.PROPOSED) {
            throw new ConflictError(`Content with hash ${draft.hash} has been proposed already and cannot be deleted`);
          }

          if (draft.formatType === PROJECT_CONTENT_FORMAT.DAR || draft.formatType === PROJECT_CONTENT_FORMAT.PACKAGE) {
            const archiveDir = FileStorage.getProjectDarArchiveDirPath(draft.nftCollectionId, draft.folder);
            const exists = await FileStorage.exists(archiveDir);
            if (!exists) {
              throw new NotFoundError(`Dar "${archiveDir}" is not found`);
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

  deleteNftItemMetadataDraft = this.command({
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.DELETE_NFT_ITEM_METADATA_DRAFT);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts app cmd`);
          }

          const { _id } = appCmd.getCmdPayload();
          const draft = await nftItemMetadataDraftService.getNftItemMetadataDraft(_id);
          if (!draft) {
            throw new NotFoundError(`Draft for "${_id}" id is not found`);
          }

          const user = await userService.getUser(draft.owner);
          const username = ctx.state.user.username;

          if (user) {
            if (user._id !== username) {
              throw new ForbiddenError(`"${username}" is not permitted to edit "${nftCollectionId}" nft collection`);
            }
          } else {
            const isAuthorized = await teamDtoService.authorizeTeamAccount(draft.owner, username)
            if (!isAuthorized) {
              throw new ForbiddenError(`"${username}" is not permitted to edit "${nftCollectionId}" nft collection`);
            }
          }

          // if there is a proposal for this content (no matter is it approved or still in voting progress)
          // we must respond with an error as blockchain hashed data should not be modified
          if (draft.status == PROJECT_CONTENT_DRAFT_STATUS.PROPOSED) {
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

  uploadNftItemMetadataPackage = this.command({
    form: ProjectContentPackageForm, h: async (ctx) => {
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


  createFungibleTokenTransferRequest = this.command({
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


  createNonFungibleTokenTransferRequest = this.command({
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


  createFungibleToken = this.command({
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
  
  createNftCollection = this.command({
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
              throw new ForbiddenError(`"${username}" is not permitted to edit "${nftCollectionId}" nft collection`);
            }
          } else if (issuer !== username) {
            throw new BadRequestError(`Can't create nft collection for other accounts`);
          }
        };

        const msg = ctx.state.msg;
        await assetCmdHandler.process(msg, ctx, validate);

        const entityId = this.extractEntityId(msg, APP_CMD.CREATE_NFT_COLLECTION);
        ctx.successRes({ _id: String(entityId) });
      } catch (err) {
        ctx.status = err.httpStatus || 500;
        ctx.body = err.message;
      }
    }
  });

  createNftCollectionMetadata = this.command({
    form: ProjectForm,
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
              throw new ForbiddenError(`"${username}" is not permitted to edit "${nftCollectionId}" nft collection`);
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


  updateNftCollectionMetadata = this.command({
    form: ProjectForm,
    h: async (ctx) => {
      try {

        const validate = async (appCmds) => {
          const appCmd = appCmds.find(cmd => cmd.getCmdNum() === APP_CMD.UPDATE_NFT_COLLECTION_METADATA);
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }

          const { _id: nftCollectionId } = appCmd.getCmdPayload();
          const nftCollectionMetadata = await nftCollectionMetadataService.getNftCollectionMetadata(nftCollectionId);
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
  

  issueFungibleToken = this.command({
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

  createNftItem = this.command({
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

          const nftCollection = await nftCollectionMetadataService.getNftCollectionMetadata(nftCollectionId);

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

          const instance = await nftItemDtoService.getNonFungibleTokenClassInstancesByOwner(ctx.state.user.username, nftCollectionId);
          if (instance.nftItemsIds.includes(nftItemId)) {
            throw new ConflictError(`nftItemId ${nftItemId} already exist`);
          }
          if (nftItemId === 0) {
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

  moderateNftItemMetadataDraft = this.command({
    h: async (ctx) => {
      try {
        const validate = async (appCmds) => {
          const validCmds = [APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_STATUS, APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_MODERATION_MSG];
          const appCmd = appCmds.find(cmd => validCmds.includes(cmd.getCmdNum()));
          if (!appCmd) {
            throw new BadRequestError(`This endpoint accepts protocol cmd`);
          }

          const { IN_PROGRESS, PROPOSED, REJECTED, APPROVED } = PROJECT_CONTENT_DRAFT_STATUS;
          const jwtUsername = ctx.state.user.username;
          const moderators = ctx.state.portal.profile.settings.moderation.moderators || [];
          const isModerator = moderators.includes(jwtUsername);
          const { _id: draftId } = appCmd.getCmdPayload();
          const draft = await nftItemMetadataDraftService.getNftItemMetadataDraft(draftId);
          if (!draft)
            throw new NotFoundError(`Draft for "${draftId}" id is not found`);

          const isAuthorized = await teamDtoService.authorizeTeamAccount(draft?.owner, jwtUsername);

          if (!isAuthorized && !isModerator)
            throw new ForbiddenError(`"${jwtUsername}" is not permitted to edit "${draftId}" draft`);

          if (appCmd.getCmdNum() === APP_CMD.UPDATE_NFT_ITEM_METADATA_DRAFT_STATUS) {
            const { status } = appCmd.getCmdPayload();

            if (!PROJECT_CONTENT_DRAFT_STATUS[status])
              throw new BadRequestError(`This endpoint assepts only project-content draft status`)

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