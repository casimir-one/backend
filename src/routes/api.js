import koa_router from 'koa-router'
import compose from 'koa-compose';
import users from '../controllers/legacy/users'
import joinRequests from '../controllers/legacy/joinRequests'
import reviewRequests from '../controllers/legacy/reviewRequests'
import expertise from '../controllers/legacy/expertise'
import notifications from '../controllers/legacy/notifications'
import proposals from '../controllers/legacy/proposals'
import researchGroups from '../controllers/legacy/researchGroups'
import invites from '../controllers/legacy/invites'
import reviews from '../controllers/legacy/reviews'
import research from '../controllers/legacy/research'
import grants from '../controllers/legacy/grants'
import expressLicensing from '../controllers/legacy/expressLicensing'
import tenant from '../controllers/legacy/tenant';
import researchContent from './../controllers/legacy/researchContent';
import researchNda from './../controllers/legacy/researchNda';

import { projectsCtrl, proposalsCtrl, teamsCtrl, attributesCtrl, assetsCtrl, domainsCtrl, usersCtrl, fundraisingCtrl, documentTemplatesCtrl } from '../controllers';

import * as blockchainService from './../utils/blockchain';
import ResearchContentProposedEvent from './../events/legacy/researchContentProposedEvent';

import researchContentFileReadAuth from './../middlewares/auth/researchContent/readFileAuth';
import researchContentFileUpdateAuth from './../middlewares/auth/researchContent/updateFileAuth';
import researchContentFileCreateAuth from './../middlewares/auth/researchContent/createFileAuth';
import researchContentFileDeleteAuth from './../middlewares/auth/researchContent/deleteFileAuth';
import researchContentFilePublishAuth from './../middlewares/auth/researchContent/publishFileAuth';

import attributeFileProxy from './../middlewares/proxy/attribute/attributeFileProxy';
import projectCmdProxy from './../middlewares/proxy/project/projectCmdProxy';
import teamCmdProxy from './../middlewares/proxy/team/teamCmdProxy';
import userCmdProxy from './../middlewares/proxy/user/userCmdProxy';

import readGrantAwardWithdrawalRequestAuth from './../middlewares/auth/grantAwardWithdrawalRequest/readGrantAwardWithdrawalRequestAuth';

import userAvatarFileReadAuth from './../middlewares/auth/user/readAvatarFileAuth';
import userAttributeMetaUpdateAuth from '../middlewares/auth/user/updateAttributeMetaAuth';

import researchGroupLogoFileReadAuth from './../middlewares/auth/researchGroup/readLogoFileAuth';


const protected_route = koa_router()
const public_route = koa_router()

async function tenantRoute(ctx, next) {
  ctx.state.isTenantRoute = true;
  await next();
}

async function tenantAdminGuard(ctx, next) {
  ctx.assert(ctx.state.isTenantAdmin, 401);
  await next();
}

public_route.get('/user/avatar/:username', compose([userAvatarFileReadAuth()]), users.getAvatar)

protected_route.post('/bookmarks/user/:username', users.addUserBookmark)
protected_route.delete('/bookmarks/user/:username/remove/:bookmarkId', users.removeUserBookmark)

protected_route.post('/join-requests', joinRequests.createJoinRequest)
protected_route.put('/join-requests', joinRequests.updateJoinRequest)
protected_route.get('/join-requests/group/:researchGroupExternalId', joinRequests.getJoinRequestsByGroup)
protected_route.get('/join-requests/user/:username', joinRequests.getJoinRequestsByUser)

protected_route.post('/review-requests', reviewRequests.createReviewRequest);
protected_route.post('/review-requests/:id/deny', reviewRequests.denyReviewRequest);
protected_route.get('/review-requests/expert/:username', reviewRequests.getReviewRequestsByExpert);
protected_route.get('/review-requests/requestor/:username', reviewRequests.getReviewRequestsByRequestor);


public_route.get('/expertise/user/:username/tokens', expertise.getAccountExpertiseTokens)
public_route.get('/expertise/discipline/:disciplineExternalId/tokens', expertise.getDisciplineExpertiseTokens)

public_route.get('/expertise/user/:username/history', expertise.getAccountEciHistory)
public_route.get('/expertise/user/:username/stats', expertise.getAccountEciStats)
public_route.get('/expertise/users/stats', expertise.getAccountsEciStats)
public_route.get('/expertise/research/:research/history', expertise.getResearchEciHistory)
public_route.get('/expertise/research/:research/stats', expertise.getResearchEciStats)
public_route.get('/expertise/research/stats', expertise.getResearchesEciStats)
public_route.get('/expertise/research-content/:researchContent/history', expertise.getResearchContentEciHistory)
public_route.get('/expertise/research-content/:researchContent/stats', expertise.getResearchContentEciStats)
public_route.get('/expertise/research-content/stats', expertise.getResearchContentsEciStats)
public_route.get('/expertise/disciplines/history', expertise.getDisciplineEciHistory)
public_route.get('/expertise/disciplines/stats-history', expertise.getDisciplinesEciStatsHistory)
public_route.get('/expertise/disciplines/stats', expertise.getDisciplinesEciLastStats)
public_route.get('/expertise/content/:contentId/discipline/:disciplineId/history', expertise.getEciHistoryByResearchContentAndDiscipline)
public_route.get('/expertise/research/:researchId', expertise.getExpertiseContributionsByResearch)
public_route.get('/expertise/research/:researchId/discipline/:disciplineId', expertise.getExpertiseContributionsByResearchAndDiscipline)
public_route.get('/expertise/content/:contentId/discipline/:disciplineId', expertise.getExpertiseContributionByResearchContentAndDiscipline)
public_route.get('/expertise/content/:contentId', expertise.getExpertiseContributionsByResearchContent)

protected_route.get('/notifications/user/:username', notifications.getNotificationsByUser)
protected_route.put('/notifications/:username/mark-read/:notificationId', notifications.markUserNotificationAsRead)
protected_route.put('/notifications/:username/mark-all-read', notifications.markAllUserNotificationAsRead)


protected_route.get('/proposals/:proposalExternalId', proposals.getProposalById)
protected_route.post('/proposals', proposals.createProposal)
protected_route.put('/proposals', proposals.updateProposal)
protected_route.put('/proposals/delete', proposals.deleteProposal)

protected_route.put('/v2/proposals/update', proposalsCtrl.updateProposal)
protected_route.put('/v2/proposals/decline', proposalsCtrl.declineProposal)

protected_route.get('/proposals/:username/:status', proposals.getAccountProposals)

public_route.get('/groups/logo/:researchGroupExternalId', compose([researchGroupLogoFileReadAuth()]), researchGroups.getResearchGroupLogo)
public_route.get('/team/:teamId/attribute/:attributeId/file/:filename', compose([attributeFileProxy()]), researchGroups.getTeamAttributeFile)
protected_route.post('/groups/leave', researchGroups.leaveResearchGroup)


protected_route.get('/invites/:username', invites.getUserInvites)
protected_route.get('/invites/group/:researchGroupExternalId', invites.getResearchGroupPendingInvites)
protected_route.get('/invites/research/:researchExternalId', invites.getResearchPendingInvites)
protected_route.post('/invites', invites.createUserInvite)


public_route.get('/reviews/:reviewExternalId', reviews.getReview)
public_route.get('/reviews/votes/:reviewExternalId', reviews.getReviewVotes)
public_route.get('/reviews/research/:researchExternalId', reviews.getReviewsByResearch)
public_route.get('/reviews/research-content/:researchContentExternalId', reviews.getReviewsByResearchContent)
public_route.get('/reviews/author/:author', reviews.getReviewsByAuthor)
protected_route.post('/reviews', reviews.createReview)


public_route.get('/research/listing', research.getPublicResearchListing)
public_route.get('/research/:researchExternalId', research.getResearch)
public_route.get('/researches', research.getResearches)
public_route.get('/research/:researchExternalId/attribute/:attributeId/file/:filename', compose([attributeFileProxy()]), research.getResearchAttributeFile)
protected_route.get('/research/user/listing/:username', research.getUserResearchListing)
protected_route.get('/research/group/listing/:researchGroupExternalId', research.getResearchGroupResearchListing)
public_route.get('/research/listing', research.getTenantResearchListing)

protected_route.post('/research/application', research.createResearchApplication)
protected_route.put('/research/application/:proposalId', research.editResearchApplication)
protected_route.get('/research/application/listing', research.getResearchApplications)
protected_route.get('/research/application/:proposalId/attachment', research.getResearchApplicationAttachmentFile)
// protected_route.post('/research/application/approve', research.approveResearchApplication)
protected_route.post('/research/application/reject', research.rejectResearchApplication)
protected_route.post('/research/application/delete', research.deleteResearchApplication)

public_route.get('/research-content/listing', researchContent.getPublicResearchContentListing)
public_route.get('/research-content/:researchContentExternalId', researchContent.getResearchContent)
public_route.get('/research-content/research/:researchExternalId', researchContent.getResearchContentAndDraftsByResearch)
public_route.get('/research-content/tenant/:tenantId', researchContent.getResearchContentsByTenant)
public_route.get('/research-content/ref/:refId', researchContent.getResearchContentRef)
public_route.get('/research-content/ref/graph/:contentId', researchContent.getResearchContentReferencesGraph)

protected_route.post('/research-content/ref/publish', compose([researchContentFilePublishAuth({ researchEnitytId: (ctx) => {  // TODO: replace with protected_route
  const researchContentProposedEvent = new ResearchContentProposedEvent(blockchainService.extractOperations(ctx.request.body.tx), {});
  const { researchExternalId } = researchContentProposedEvent.getSourceData();
  return researchExternalId;
 } })]), researchContent.createResearchContent)
protected_route.put('/research-content/ref/unlock/:refId', compose([researchContentFilePublishAuth({ researchContentEnitytId: 'refId' })]), researchContent.unlockResearchContentDraft)
protected_route.delete('/research-content/ref/:refId', compose([researchContentFileDeleteAuth({ researchContentEnitytId: 'refId'})]), researchContent.deleteResearchContentDraft)
protected_route.get('/research-content/texture/:researchContentExternalId', compose([researchContentFileReadAuth()]), researchContent.readResearchContentDarArchive)
protected_route.get('/research-content/texture/:researchContentExternalId/assets/:file', compose([researchContentFileReadAuth()]), researchContent.readResearchContentDarArchiveStaticFiles)
protected_route.put('/research-content/texture/:researchContentExternalId', compose([researchContentFileUpdateAuth()]), researchContent.updateResearchContentDarArchive)
protected_route.post('/research-content/texture/:researchExternalId', compose([researchContentFileCreateAuth()]), researchContent.createResearchContentDarArchive)
protected_route.post('/research-content/package', compose([researchContentFileCreateAuth({ researchEnitytId: (ctx) => ctx.request.header['research-external-id'] })]), researchContent.uploadResearchContentPackage)
protected_route.get('/research-content/package/:researchContentExternalId/:fileHash', compose([researchContentFileReadAuth()]), researchContent.getResearchContentPackageFile)

protected_route.get('/award-withdrawal-requests/:awardNumber/:paymentNumber', grants.getAwardWithdrawalRequestRefByHash)
public_route.get('/award-withdrawal-requests/:awardNumber/:paymentNumber/:fileHash', compose([readGrantAwardWithdrawalRequestAuth()]), grants.getAwardWithdrawalRequestAttachmentFile)
protected_route.post('/award-withdrawal-requests/upload-attachments', grants.createAwardWithdrawalRequest)

protected_route.post('/express-licensing', expressLicensing.createExpressLicenseRequest)
protected_route.get('/express-licensing/externalId/:externalId', expressLicensing.getResearchLicense)
protected_route.get('/express-licensing/licensee/:licensee', expressLicensing.getResearchLicensesByLicensee)
protected_route.get('/express-licensing/licenser/:licenser', expressLicensing.getResearchLicensesByLicenser)
protected_route.get('/express-licensing/researchId/:researchId', expressLicensing.getResearchLicensesByResearch)
protected_route.get('/express-licensing/licensee/:licensee/researchId/:researchId', expressLicensing.getResearchLicensesByLicenseeAndResearch)
protected_route.get('/express-licensing/licensee/:licensee/licenser/:licenser', expressLicensing.getResearchLicensesByLicenseeAndLicenser)

public_route.get('/network/tenants/listing', tenant.getNetworkTenants)
public_route.get('/network/tenants/:tenant', tenant.getNetworkTenant)

protected_route.post('/infrastructure/tenant/sign', tenant.signTxByTenant)
protected_route.post('/infrastructure/tenant/affirm', tenant.affirmTxByTenant)

protected_route.post('/nda', researchNda.createResearchNonDisclosureAgreement);
public_route.get('/nda/:ndaExternalId', researchNda.getResearchNonDisclosureAgreement);
public_route.get('/nda/creator/:username', researchNda.getResearchNonDisclosureAgreementsByCreator);
public_route.get('/nda/research/:researchExternalId', researchNda.getResearchNonDisclosureAgreementsByResearch);


/* V2 */
public_route.get('/v2/project/:projectId', projectsCtrl.getProject)
public_route.get('/v2/project/default/:accountId', projectsCtrl.getDefaultProject)
public_route.get('/v2/projects', projectsCtrl.getProjects)
protected_route.post('/v2/project', compose([projectCmdProxy()]), projectsCtrl.createProject)
protected_route.put('/v2/project', compose([projectCmdProxy()]), projectsCtrl.updateProject)
protected_route.put('/v2/project/delete', compose([projectCmdProxy()]), projectsCtrl.deleteProject)

protected_route.post('/v2/team', compose([teamCmdProxy()]), teamsCtrl.createTeam)
protected_route.put('/v2/team', compose([teamCmdProxy()]), teamsCtrl.updateTeam)
public_route.get('/v2/teams/listing', teamsCtrl.getTeamsListing)
public_route.get('/v2/team/:teamId', teamsCtrl.getTeam)
public_route.get('/v2/teams/member/:username', teamsCtrl.getTeamsByUser)
public_route.get('/v2/teams/tenant/:tenantId', teamsCtrl.getTeamsByTenant)

public_route.get('/v2/attributes', attributesCtrl.getAttributes);
public_route.get('/v2/attributes/scope/:scope', attributesCtrl.getAttributesByScope);
public_route.get('/v2/attributes/scope/network/:scope', attributesCtrl.getNetworkAttributesByScope);
public_route.get('/v2/attribute/:id', attributesCtrl.getAttribute);
public_route.get('/v2/attributes/network', attributesCtrl.getNetworkAttributes);
public_route.get('/v2/attributes/system', attributesCtrl.getSystemAttributes);
protected_route.post('/v2/attribute', compose([tenantRoute, tenantAdminGuard]), attributesCtrl.createAttribute);
protected_route.put('/v2/attribute', compose([tenantRoute, tenantAdminGuard]), attributesCtrl.updateAttribute);
protected_route.put('/v2/attribute/delete', compose([tenantRoute, tenantAdminGuard]), attributesCtrl.deleteAttribute);

public_route.get('/v2/assets/id/:assetId', assetsCtrl.getAssetById)
public_route.get('/v2/assets/symbol/:symbol', assetsCtrl.getAssetBySymbol)
public_route.get('/v2/assets/type/:type', assetsCtrl.getAssetsByType)
public_route.get('/v2/assets/issuer/:issuer', assetsCtrl.getAssetsByIssuer)
public_route.get(['/v2/assets/limit/:limit/', '/v2/assets/limit/:limit/:lowerBoundSymbol'], assetsCtrl.lookupAssets)
protected_route.get('/v2/assets/deposit/history/account/:account', assetsCtrl.getAccountDepositHistory)
protected_route.get('/v2/assets/owner/:owner/symbol/:symbol', assetsCtrl.getAccountAssetBalance)
protected_route.get('/v2/assets/owner/:owner', assetsCtrl.getAccountAssetsBalancesByOwner)
public_route.get('/v2/assets/accounts/symbol/:symbol', assetsCtrl.getAccountsAssetBalancesByAsset)
protected_route.post('/v2/assets/transfer', assetsCtrl.createAssetTransferRequest)
protected_route.post('/v2/assets/exchange', assetsCtrl.createAssetExchangeRequest)

public_route.get('/v2/domains', domainsCtrl.getDomains)
public_route.get('/v2/domains/project/:projectId', domainsCtrl.getDomainsByProject)

public_route.get('/v2/user/profile/:username', usersCtrl.getUserProfile)
public_route.get('/v2/users/profile', usersCtrl.getUsersProfiles)
public_route.get('/v2/users/active', usersCtrl.getActiveUsersProfiles)
public_route.get('/v2/user/name/:username', usersCtrl.getUser)
public_route.get('/v2/user/email/:email', usersCtrl.getUserByEmail)
public_route.get('/v2/users', usersCtrl.getUsers)
public_route.get('/v2/users/listing', usersCtrl.getUsersListing)
public_route.get('/v2/users/team/:teamId', usersCtrl.getUsersByTeam)
public_route.get('/v2/users/tenant/:tenantId', usersCtrl.getUsersByTenant)

protected_route.put('/v2/user/update', compose([userCmdProxy()]), usersCtrl.updateUser)
public_route.get('/user/:username/attribute/:attributeId/file/:filename', compose([attributeFileProxy()]), usersCtrl.getUserAttributeFile)

protected_route.get('/v2/bookmarks/user/:username', usersCtrl.getUserBookmarks)

public_route.get('/v2/fundraising/project/:projectId', fundraisingCtrl.getProjectTokenSalesByProject)
protected_route.post('/v2/fundraising', fundraisingCtrl.createProjectTokenSale)
protected_route.post('/v2/fundraising/contributions', fundraisingCtrl.createProjectTokenSaleContribution)
protected_route.get('/v2/fundraising/:projectTokenSaleExternalId/contributions', fundraisingCtrl.getProjectTokenSaleContributions)
protected_route.get('/v2/fundraising/project/:projectId/contributions', fundraisingCtrl.getProjectTokenSaleContributionsByProject)
protected_route.get('/v2/fundraising/token-sale/:tokenSaleId', fundraisingCtrl.getProjectTokenSale)

protected_route.get('/v2/history/account/:account/:symbol/:step/:cursor/asset/:targetAsset', fundraisingCtrl.getAccountRevenueHistoryByAsset)
protected_route.get('/v2/history/account/:account/:cursor', fundraisingCtrl.getAccountRevenueHistory)
protected_route.get('/v2/history/contributions/account/:account', fundraisingCtrl.getAccountContributionsHistory)
protected_route.get('/v2/history/contributions/token-sale/:tokenSaleId', fundraisingCtrl.getContributionsHistoryByTokenSale)
protected_route.get('/v2/history/symbol/:symbol/:cursor', fundraisingCtrl.getAssetRevenueHistory)

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