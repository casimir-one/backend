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

/* V3 [protobuf] */

public_route.get('/v3/collections', assetsCtrl.getNFTCollections);
public_route.get('/v3/collections/:nftCollectionId', assetsCtrl.getNFTCollection);
protected_route.post('/v3/collections', assetsCtrl.createNFTCollection);
protected_route.put('/v3/collections', assetsCtrl.updateNFTCollection);

public_route.get('/v3/items', assetsCtrl.getNFTItemsPaginated);
public_route.get('/v3/items/:nftItemId', assetsCtrl.getNFTItem);
protected_route.post('/v3/items', assetsCtrl.createNFTItem);
protected_route.put('/v3/items', assetsCtrl.updateNFTItem);
protected_route.put('/v3/items/moderate', assetsCtrl.moderateNFTItem);
protected_route.delete('/v3/items', assetsCtrl.deleteNFTItem);

protected_route.post('/v3/users', usersCtrl.createUser);

/* V2 */

protected_route.put('/v2/proposals/update', proposalsCtrl.acceptProposal)
protected_route.put('/v2/proposals/decline', proposalsCtrl.declineProposal)
protected_route.get('/v2/proposals/:proposalId', proposalsCtrl.getProposalById)
protected_route.get('/v2/proposals/:username/:status', proposalsCtrl.getAccountProposals)

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
public_route.get('/v2/attribute/:id', attributesCtrl.getAttribute);

protected_route.post('/v2/attribute', compose([portalRoute, portalAdminGuard]), attributesCtrl.createAttribute);
protected_route.put('/v2/attribute', compose([portalRoute, portalAdminGuard]), attributesCtrl.updateAttribute);
protected_route.put('/v2/attribute/delete', compose([portalRoute, portalAdminGuard]), attributesCtrl.deleteAttribute);
public_route.get('/attribute/file/:scope/:entityId/:attributeId/:filename', attributesCtrl.getAttributeFile);


public_route.get('/v2/tokens/ft/id/:ftId', assetsCtrl.getFTClassById)
public_route.get('/v2/tokens/ft/symbol/:symbol', assetsCtrl.getFTClassBySymbol)
public_route.get('/v2/tokens/ft/issuer/:issuer', assetsCtrl.getFTClassesByIssuer)
public_route.get(['/v2/tokens/ft/limit/:limit/', '/v2/tokens/ft/limit/:limit/:lowerBoundSymbol'], assetsCtrl.lookupFTClassess)
protected_route.get('/v2/tokens/ft/owner/:ownerId/symbol/:symbol', assetsCtrl.getFTClassBalance)
protected_route.get('/v2/tokens/ft/owner/:ownerId', assetsCtrl.getFTClassBalancesByOwner)
public_route.get('/v2/tokens/ft/accounts/symbol/:symbol', assetsCtrl.getFTClassBalancesBySymbol)
protected_route.post('/v2/tokens/ft/transfer', assetsCtrl.createFTTransferRequest)
protected_route.post('/v2/tokens/ft/create', assetsCtrl.createFTClass)
protected_route.post('/v2/tokens/ft/issue', assetsCtrl.issueFT)

public_route.get('/v2/user/profile/:username', usersCtrl.getUserProfile)
public_route.get('/v2/users/profile', usersCtrl.getUsersProfiles)
public_route.get('/v2/users/active', usersCtrl.getActiveUsersProfiles)
public_route.get('/v2/user/name/:username', usersCtrl.getUser)
public_route.get('/v2/user/email/:email', usersCtrl.getUserByEmail)
public_route.get('/v2/users', usersCtrl.getUsers)
public_route.get('/v2/users/listing', usersCtrl.getUsersListing)
public_route.get('/v2/users/team/:teamId', usersCtrl.getUsersByTeam)
public_route.get('/v2/users/portal/:portalId', usersCtrl.getUsersByPortal)

protected_route.put('/v2/user/update', usersCtrl.updateUser)
protected_route.put('/v2/user/update/password', usersCtrl.updateUserPassword)

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
