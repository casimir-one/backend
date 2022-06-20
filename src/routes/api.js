import koa_router from 'koa-router'
import compose from 'koa-compose';

import {
  proposalsCtrl,
  teamsCtrl,
  attributesCtrl,
  assetsCtrl,
  usersCtrl,
  documentTemplatesCtrl,
  portalCtrl,
  layoutsCtrl
} from '../controllers';

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

public_route.get('/network/portals/listing', portalCtrl.getNetworkPortals)
public_route.get('/network/portals/:portal', portalCtrl.getNetworkPortal)

/* V2 */

protected_route.post('/v2/team', teamsCtrl.createTeam)
protected_route.put('/v2/team', teamsCtrl.updateTeam)
public_route.get('/v2/teams', teamsCtrl.getTeams)
protected_route.post('/v2/team/join', teamsCtrl.joinTeam)
protected_route.post('/v2/team/leave', teamsCtrl.leaveTeam)
public_route.get('/v2/teams/listing', teamsCtrl.getTeamsListing)
public_route.get('/v2/teams/listing-paginated', teamsCtrl.getTeamsListingPaginated)
public_route.get('/v2/team/:teamId', teamsCtrl.getTeam)
public_route.get('/v2/teams/member/:username', teamsCtrl.getTeamsByUser)
public_route.get('/v2/teams/portal/:portalId', teamsCtrl.getTeamsByPortal)
public_route.get('/team/logo/:teamId', teamsCtrl.getTeamLogo)

public_route.get('/v2/attributes', attributesCtrl.getAttributes);
public_route.get('/v2/attributes/scope/:scope', attributesCtrl.getAttributesByScope);
public_route.get('/v2/attributes/scope/network/:scope', attributesCtrl.getNetworkAttributesByScope);
public_route.get('/v2/attribute/:id', attributesCtrl.getAttribute);
public_route.get('/v2/attributes/network', attributesCtrl.getNetworkAttributes);
public_route.get('/v2/attributes/system', attributesCtrl.getSystemAttributes);
protected_route.post('/v2/attribute', compose([portalRoute, portalAdminGuard]), attributesCtrl.createAttribute);
protected_route.put('/v2/attribute', compose([portalRoute, portalAdminGuard]), attributesCtrl.updateAttribute);
protected_route.put('/v2/attribute/delete', compose([portalRoute, portalAdminGuard]), attributesCtrl.deleteAttribute);
public_route.get('/attribute/file/:scope/:entityId/:attributeId/:filename', attributesCtrl.getAttributeFile);

protected_route.get('/v2/assets/deposit/history/account/:account', assetsCtrl.getAccountDepositHistory)
public_route.get('/v2/assets/type/:type', assetsCtrl.getAssetsByType)
protected_route.get('/v2/assets/issuer/:issuer', assetsCtrl.getAssetsByIssuer)
public_route.get('/v2/assets/limit/:limit', assetsCtrl.lookupAssets)

public_route.get('/v2/tokens/nft/:nftCollectionId', assetsCtrl.getNFTCollection)
public_route.get('/v2/tokens/nft/default/:issuer', assetsCtrl.getDefaultNFTCollection)
public_route.get('/v2/tokens/nfts', assetsCtrl.getNFTCollectionsByIds)
public_route.get('/v2/tokens/nfts/listing', assetsCtrl.getPublicNFTCollectionsListing)
protected_route.get('/v2/tokens/nfts/listing/issuer/:issuer', assetsCtrl.getNFTCollectionsByIssuer)
public_route.get('/v2/tokens/nfts/portal/listing', assetsCtrl.getNFTCollectionsByPortal)

public_route.get('/v2/tokens/nft/items/listing', assetsCtrl.getPublicNFTItemsListing)
public_route.get('/v2/tokens/nft/items/listing-paginated', assetsCtrl.getNFTItemsListingPaginated)
public_route.get('/v2/tokens/nft/items/drafts/listing-paginated', assetsCtrl.getNFTItemsMetadataDraftsListingPaginated)
public_route.get('/v2/tokens/nft/items/drafts/nft-collection/:nftCollectionId', assetsCtrl.getNFTItemMetadataDraftsByNFTCollection)
public_route.get('/v2/tokens/nft/item/:nftCollectionId/:nftItemId', assetsCtrl.getNFTItem)
public_route.get('/v2/tokens/nft/items/nft-collection/:nftCollectionId', assetsCtrl.getNFTItemsByNFTCollection)
public_route.get('/v2/tokens/nft/items/portal/:portalId', assetsCtrl.getNFTItemsByPortal)
public_route.get('/v2/tokens/nft/item/draft/:nftItemDraftId', assetsCtrl.getNFTItemMetadataDraft)
public_route.get('/v2/tokens/nft/item/package/:nftCollectionId/:nftItemId/:fileHash', assetsCtrl.getNFTItemPackageFile)

public_route.get('/v2/tokens/ft/id/:ftId', assetsCtrl.getFTClassById)
public_route.get('/v2/tokens/ft/symbol/:symbol', assetsCtrl.getFTClassBySymbol)
public_route.get('/v2/tokens/ft/issuer/:issuer', assetsCtrl.getFTClassesByIssuer)
public_route.get(['/v2/tokens/ft/limit/:limit/', '/v2/tokens/ft/limit/:limit/:lowerBoundSymbol'], assetsCtrl.lookupFTClassess)
protected_route.get('/v2/tokens/ft/owner/:owner/symbol/:symbol', assetsCtrl.getFTClassBalance)
protected_route.get('/v2/tokens/ft/owner/:owner', assetsCtrl.getFTClassBalancesByOwner)
public_route.get('/v2/tokens/ft/accounts/symbol/:symbol', assetsCtrl.getFTClassBalancesBySymbol)
protected_route.post('/v2/tokens/ft/transfer', assetsCtrl.createFTTransferRequest)
protected_route.post('/v2/tokens/nft/transfer', assetsCtrl.createNFTTransferRequest)
protected_route.post('/v2/tokens/nft/lazy-sell', assetsCtrl.createNFTLazySellProposal)
protected_route.post('/v2/tokens/nft/lazy-buy', assetsCtrl.createNFTLazyBuyProposal)
protected_route.post('/v2/tokens/swap', assetsCtrl.createTokenSwapRequest)
protected_route.post('/v2/tokens/ft/create', assetsCtrl.createFTClass)
protected_route.post('/v2/tokens/nft/create', assetsCtrl.createNFTCollection)
protected_route.post('/v2/tokens/nft/metadata/create', assetsCtrl.createNFTCollectionMetadata)
protected_route.put('/v2/tokens/nft/metadata/update', assetsCtrl.updateNFTCollectionMetadata)
protected_route.post('/v2/tokens/ft/issue', assetsCtrl.issueFt)
protected_route.post('/v2/tokens/nft/item/create', assetsCtrl.createNFTItem)
protected_route.post('/v2/tokens/nft/item/metadata/create', assetsCtrl.createNFTItemMetadata)
protected_route.post('/v2/tokens/nft/item/metadata/draft/create', assetsCtrl.createNFTItemMetadataDraft)
protected_route.put('/v2/tokens/nft/item/metadata/draft/update', assetsCtrl.updateNFTItemMetadataDraft)
protected_route.put('/v2/tokens/nft/item/metadata/draft/delete', assetsCtrl.deleteNFTItemMetadataDraft)
protected_route.put('/v2/tokens/nft/item/metadata/draft/moderate', assetsCtrl.moderateNFTItemMetadataDraft)

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

protected_route.put('/v2/user/update', usersCtrl.updateUser)
protected_route.put('/v2/user/update/password', usersCtrl.updateUserPassword)
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
