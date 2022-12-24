import koa_router from 'koa-router'
import compose from 'koa-compose';

import {
  proposalsCtrl,
  teamsCtrl,
  attributesCtrl,
  assetsCtrl,
  itemsCtrl,
  collectionsCtrl,
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

public_route.get('/v3/collections', collectionsCtrl.getCollections);
public_route.get('/v3/collections/:nftCollectionId', collectionsCtrl.getCollection);
protected_route.post('/v3/collections', collectionsCtrl.createCollection);
protected_route.put('/v3/collections', collectionsCtrl.updateCollection);

public_route.get('/v3/items', itemsCtrl.getItems);
public_route.get('/v3/items/:nftItemId', itemsCtrl.getItem);
protected_route.post('/v3/items', itemsCtrl.createItem);
protected_route.put('/v3/items', itemsCtrl.updateItem);
protected_route.put('/v3/items/delete', itemsCtrl.deleteItem);
protected_route.put('/v3/items/moderate', itemsCtrl.moderateItem); // TODO: move to a separate module

public_route.get('/v3/users', usersCtrl.getUsers);
public_route.get('/v3/users/:usernameOrEmail', usersCtrl.getUser);
protected_route.post('/v3/users', usersCtrl.createUser);
protected_route.put('/v3/users', usersCtrl.updateUser);

public_route.get('/v3/attributes', attributesCtrl.getAttributes);
public_route.get('/v3/attributes/:attributeId', attributesCtrl.getAttribute);
protected_route.post('/v3/attributes', compose([portalRoute, portalAdminGuard]), attributesCtrl.createAttribute);
protected_route.put('/v3/attributes', compose([portalRoute, portalAdminGuard]), attributesCtrl.updateAttribute);
protected_route.put('/v3/attributes/delete', compose([portalRoute, portalAdminGuard]), attributesCtrl.deleteAttribute);
public_route.get('/v3/attributes/file/:scope/:_id/:attributeId/:filename', attributesCtrl.getAttributeFile);

public_route.get('/v3/layouts', layoutsCtrl.getLayouts);
public_route.get('/v3/layouts/:layoutId', layoutsCtrl.getLayout);
protected_route.post('/v3/layouts', compose([portalAdminGuard]), layoutsCtrl.createLayout);
protected_route.put('/v3/layouts', compose([portalAdminGuard]), layoutsCtrl.updateLayout);
protected_route.put('/v3/layouts/delete', compose([portalAdminGuard]), layoutsCtrl.deleteLayout);


/* V2 */

protected_route.put('/v2/proposals/update', proposalsCtrl.acceptProposal)
protected_route.put('/v2/proposals/decline', proposalsCtrl.declineProposal)
protected_route.get('/v2/proposals/:proposalId', proposalsCtrl.getProposalById)
protected_route.get('/v2/proposals/:_id/:status', proposalsCtrl.getAccountProposals)

protected_route.post('/v2/team', teamsCtrl.createTeam)
protected_route.put('/v2/team', teamsCtrl.updateTeam)
public_route.get('/v2/teams', teamsCtrl.getTeams)
protected_route.post('/v2/team/join', teamsCtrl.joinTeam)
protected_route.post('/v2/team/leave', teamsCtrl.leaveTeam)
public_route.get('/v2/teams/listing', teamsCtrl.getTeamsListing)
public_route.get('/v2/teams/listing-paginated', teamsCtrl.getTeamsListingPaginated)
public_route.get('/v2/team/:teamId', teamsCtrl.getTeam)
public_route.get('/v2/teams/member/:_id', teamsCtrl.getTeamsByUser)
public_route.get('/v2/teams/portal/:portalId', teamsCtrl.getTeamsByPortal)
public_route.get('/team/logo/:teamId', teamsCtrl.getTeamLogo)



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


public_route.get('/v2/document-template/:documentTemplateId', documentTemplatesCtrl.getDocumentTemplate)
public_route.get('/v2/document-templates/account/:account', documentTemplatesCtrl.getDocumentTemplatesByAccount)
protected_route.post('/v2/document-template', documentTemplatesCtrl.createDocumentTemplate)
protected_route.put('/v2/document-template', documentTemplatesCtrl.updateDocumentTemplate)
protected_route.put('/v2/document-template/delete', documentTemplatesCtrl.deleteDocumentTemplate)


const routes = {
  protected: koa_router().use('/api', protected_route.routes()),
  public: koa_router().use('/api', public_route.routes())
}


module.exports = routes;