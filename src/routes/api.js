import koa_router from 'koa-router'
import compose from 'koa-compose';

import {
  proposalsCtrl,
  teamsCtrl,
  attributesCtrl,
  assetsCtrl,
  usersCtrl,
  documentTemplatesCtrl,
  revenuesCtrl,
  portalCtrl,
  invitesCtrl,
  layoutsCtrl
} from '../controllers';

import attributeFileProxy from './../middlewares/proxy/attribute/attributeFileProxy';
import nftCollectionCmdProxy from '../middlewares/proxy/project/nftCollectionCmdProxy';
import nftItemCmdProxy from '../middlewares/proxy/projectContent/nftItemCmdProxy';
import nftItemMetadataDraftCmdProxy from '../middlewares/proxy/projectContent/nftItemMetadataDraftCmdProxy';
import teamCmdProxy from './../middlewares/proxy/team/teamCmdProxy';
import teamLogoProxy from './../middlewares/proxy/team/teamLogoProxy';
import userCmdProxy from './../middlewares/proxy/user/userCmdProxy';

import userAvatarFileReadAuth from './../middlewares/auth/user/readAvatarFileAuth';

const protected_route = koa_router()
const public_route = koa_router()

async function portalRoute(ctx, next) {
  ctx.state.isPortalRoute = true;
  await next();
}

async function portalAdminGuard(ctx, next) {
  ctx.assert(ctx.state.isPortalAdmin, 401);
  await next();
}

protected_route.put('/v2/proposals/update', proposalsCtrl.acceptProposal)
protected_route.put('/v2/proposals/decline', proposalsCtrl.declineProposal)
protected_route.get('/v2/proposals/:proposalId', proposalsCtrl.getProposalById)
protected_route.get('/v2/proposals/:username/:status', proposalsCtrl.getAccountProposals)

protected_route.get('/v2/invites/:username', invitesCtrl.getUserInvites)
protected_route.get('/v2/invites/team/:teamId', invitesCtrl.getTeamPendingInvites)

public_route.get('/network/portals/listing', portalCtrl.getNetworkPortals)
public_route.get('/network/portals/:portal', portalCtrl.getNetworkPortal)

/* V2 */

protected_route.post('/v2/team', compose([teamCmdProxy()]), teamsCtrl.createTeam)
protected_route.put('/v2/team', compose([teamCmdProxy()]), teamsCtrl.updateTeam)
public_route.get('/v2/teams', teamsCtrl.getTeams)
protected_route.post('/v2/team/join', teamsCtrl.joinTeam)
protected_route.post('/v2/team/leave', teamsCtrl.leaveTeam)
public_route.get('/v2/teams/listing', teamsCtrl.getTeamsListing)
public_route.get('/v2/teams/listing-paginated', teamsCtrl.getTeamsListingPaginated)
public_route.get('/v2/team/:teamId', teamsCtrl.getTeam)
public_route.get('/v2/teams/member/:username', teamsCtrl.getTeamsByUser)
public_route.get('/v2/teams/portal/:portalId', teamsCtrl.getTeamsByPortal)
public_route.get('/team/logo/:teamId', compose([teamLogoProxy()]), teamsCtrl.getTeamLogo)

public_route.get('/v2/attributes', attributesCtrl.getAttributes);
public_route.get('/v2/attributes/scope/:scope', attributesCtrl.getAttributesByScope);
public_route.get('/v2/attributes/scope/network/:scope', attributesCtrl.getNetworkAttributesByScope);
public_route.get('/v2/attribute/:id', attributesCtrl.getAttribute);
public_route.get('/v2/attributes/network', attributesCtrl.getNetworkAttributes);
public_route.get('/v2/attributes/system', attributesCtrl.getSystemAttributes);
protected_route.post('/v2/attribute', compose([portalRoute, portalAdminGuard]), attributesCtrl.createAttribute);
protected_route.put('/v2/attribute', compose([portalRoute, portalAdminGuard]), attributesCtrl.updateAttribute);
protected_route.put('/v2/attribute/delete', compose([portalRoute, portalAdminGuard]), attributesCtrl.deleteAttribute);
public_route.get('/attribute/file/:scope/:entityId/:attributeId/:filename', compose([attributeFileProxy()]), attributesCtrl.getAttributeFile);

protected_route.get('/v2/assets/deposit/history/account/:account', assetsCtrl.getAccountDepositHistory)
public_route.get('/v2/assets/type/:type', assetsCtrl.getAssetsByType)
protected_route.get('/v2/assets/issuer/:issuer', assetsCtrl.getAssetsByIssuer)
public_route.get('/v2/assets/limit/:limit', assetsCtrl.lookupAssets)

public_route.get('/v2/tokens/nft/:nftCollectionId', assetsCtrl.getNftCollection)
public_route.get('/v2/tokens/nft/default/:issuer', assetsCtrl.getDefaultNftCollection)
public_route.get('/v2/tokens/nfts', assetsCtrl.getNftCollections)
public_route.get('/v2/tokens/nfts/listing', assetsCtrl.getPublicNftCollectionsListing)
protected_route.get('/v2/tokens/nfts/listing/issuer/:issuer', assetsCtrl.getNftCollectionsByIssuer)
public_route.get('/v2/tokens/nfts/portal/listing', assetsCtrl.getNftCollectionsByPortal)

public_route.get('/v2/tokens/nft/items/listing', assetsCtrl.getPublicNftItemsListing)
public_route.get('/v2/tokens/nft/items/listing-paginated', assetsCtrl.getNftItemsListingPaginated)
public_route.get('/v2/tokens/nft/items/drafts/listing-paginated', assetsCtrl.getNftItemsMetadataDraftsListingPaginated)
public_route.get('/v2/tokens/nft/items/drafts/nft-collection/:nftCollectionId', assetsCtrl.getNftItemMetadataDraftsByNftCollection)
public_route.get('/v2/tokens/nft/item/:nftItemId', assetsCtrl.getNftItem)
public_route.get('/v2/tokens/nft/items/nft-collection/:nftCollectionId', assetsCtrl.getNftItemsByNftCollection)
public_route.get('/v2/tokens/nft/items/portal/:portalId', assetsCtrl.getNftItemsByPortal)
public_route.get('/v2/tokens/nft/item/draft/:nftItemDraftId', assetsCtrl.getNftItemMetadataDraft)
public_route.get('/v2/tokens/nft/item/package/:nftItemId/:fileHash', assetsCtrl.getNftItemPackageFile)

public_route.get('/v2/tokens/ft/id/:ftId', assetsCtrl.getFungibleTokenById)
public_route.get('/v2/tokens/ft/symbol/:symbol', assetsCtrl.getFungibleTokenBySymbol)
public_route.get('/v2/tokens/ft/issuer/:issuer', assetsCtrl.getFungibleTokensByIssuer)
public_route.get(['/v2/tokens/ft/limit/:limit/', '/v2/tokens/ft/limit/:limit/:lowerBoundSymbol'], assetsCtrl.lookupFungibleTokens)
protected_route.get('/v2/tokens/ft/owner/:owner/symbol/:symbol', assetsCtrl.getFungibleTokenBalance)
protected_route.get('/v2/tokens/ft/owner/:owner', assetsCtrl.getFungibleTokenBalancesByOwner)
public_route.get('/v2/tokens/ft/accounts/symbol/:symbol', assetsCtrl.getFungibleTokenBalancesBySymbol)
protected_route.post('/v2/tokens/ft/transfer', assetsCtrl.createFungibleTokenTransferRequest)
protected_route.post('/v2/tokens/nft/transfer', assetsCtrl.createNonFungibleTokenTransferRequest)
protected_route.post('/v2/tokens/swap', assetsCtrl.createTokenSwapRequest)
protected_route.post('/v2/tokens/ft/create', assetsCtrl.createFungibleToken)
protected_route.post('/v2/tokens/nft/create', assetsCtrl.createNftCollection)
protected_route.post('/v2/tokens/nft/metadata/create', assetsCtrl.createNftCollectionMetadata)
protected_route.put('/v2/tokens/nft/metadata/update', compose([nftCollectionCmdProxy()]), assetsCtrl.updateNftCollectionMetadata)
protected_route.post('/v2/tokens/ft/issue', assetsCtrl.issueFungibleToken)
protected_route.post('/v2/tokens/nft/item/create', assetsCtrl.createNftItem)
protected_route.post('/v2/tokens/nft/item/metadata/create', compose([nftItemCmdProxy()]), assetsCtrl.createNftItemMetadata)
protected_route.post('/v2/tokens/nft/item/metadata/draft/create', compose([nftItemMetadataDraftCmdProxy()]), assetsCtrl.createNftItemMetadataDraft)
protected_route.put('/v2/tokens/nft/item/metadata/draft/update', compose([nftItemMetadataDraftCmdProxy()]), assetsCtrl.updateNftItemMetadataDraft)
protected_route.put('/v2/tokens/nft/item/metadata/draft/delete', compose([nftItemMetadataDraftCmdProxy()]), assetsCtrl.deleteNftItemMetadataDraft)
protected_route.put('/v2/tokens/nft/item/metadata/draft/moderate', assetsCtrl.moderateNftItemMetadataDraft)

public_route.get('/v2/user/profile/:username', usersCtrl.getUserProfile)
public_route.get('/v2/users/profile', usersCtrl.getUsersProfiles)
public_route.get('/v2/users/active', usersCtrl.getActiveUsersProfiles)
public_route.get('/v2/user/name/:username', usersCtrl.getUser)
public_route.get('/v2/user/exists/username-or-email/:usernameOrEmail', usersCtrl.checkIfUserExists)
public_route.get('/v2/user/email/:email', usersCtrl.getUserByEmail)
public_route.get('/v2/users', usersCtrl.getUsers)
public_route.get('/v2/users/listing', usersCtrl.getUsersListing)
public_route.get('/v2/users/team/:teamId', usersCtrl.getUsersByTeam)
public_route.get('/v2/users/portal/:portalId', usersCtrl.getUsersByPortal)
public_route.post('/v2/user/registration-code/email/send', usersCtrl.sendRegistrationCodeByEmail)

protected_route.put('/v2/user/update', compose([userCmdProxy()]), usersCtrl.updateUser)
protected_route.put('/v2/user/update/password', compose([userCmdProxy()]), usersCtrl.updateUserPassword)
public_route.get('/user/avatar/:username', compose([userAvatarFileReadAuth()]), usersCtrl.getAvatar)

public_route.get('/v2/document-template/:documentTemplateId', documentTemplatesCtrl.getDocumentTemplate)
public_route.get('/v2/document-templates/account/:account', documentTemplatesCtrl.getDocumentTemplatesByAccount)
protected_route.post('/v2/document-template', documentTemplatesCtrl.createDocumentTemplate)
protected_route.put('/v2/document-template', documentTemplatesCtrl.updateDocumentTemplate)
protected_route.put('/v2/document-template/delete', documentTemplatesCtrl.deleteDocumentTemplate)

public_route.get('/v2/layout/:layoutId', layoutsCtrl.getLayout);
public_route.get('/v2/layouts', layoutsCtrl.getLayouts);
public_route.get('/v2/layouts/scope/:scope', layoutsCtrl.getLayoutsByScope);
protected_route.post('/v2/layout', compose([portalAdminGuard]), layoutsCtrl.createLayout);
protected_route.put('/v2/layout', compose([portalAdminGuard]), layoutsCtrl.updateLayout);
protected_route.put('/v2/layout/delete', compose([portalAdminGuard]), layoutsCtrl.deleteLayout);

const routes = {
  protected: koa_router().use('/api', protected_route.routes()),
  public: koa_router().use('/api', public_route.routes())
}

module.exports = routes;
