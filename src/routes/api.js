import koa_router from 'koa-router'
import compose from 'koa-compose';
import expertise from '../controllers/legacy/expertise'
import notifications from '../controllers/legacy/notifications'
import invites from '../controllers/legacy/invites'
import grants from '../controllers/legacy/grants'
import expressLicensing from '../controllers/legacy/expressLicensing'
import tenant from '../controllers/legacy/tenant';

import { 
  projectsCtrl, 
  proposalsCtrl, 
  teamsCtrl, 
  attributesCtrl, 
  assetsCtrl, 
  domainsCtrl, 
  usersCtrl, 
  invstOppCtrl,
  documentTemplatesCtrl,
  projectContentsCtrl,
  reviewsCtrl,
  projectNdaCtrl
} from '../controllers';

import attributeFileProxy from './../middlewares/proxy/attribute/attributeFileProxy';
import projectCmdProxy from './../middlewares/proxy/project/projectCmdProxy';
import projectContentCmdProxy from './../middlewares/proxy/projectContent/projectContentCmdProxy';
import draftCmdProxy from '../middlewares/proxy/projectContent/draftCmdProxy';
import teamCmdProxy from './../middlewares/proxy/team/teamCmdProxy';
import teamLogoProxy from './../middlewares/proxy/team/teamLogoProxy';
import userCmdProxy from './../middlewares/proxy/user/userCmdProxy';

import readGrantAwardWithdrawalRequestAuth from './../middlewares/auth/grantAwardWithdrawalRequest/readGrantAwardWithdrawalRequestAuth';
import userAvatarFileReadAuth from './../middlewares/auth/user/readAvatarFileAuth';

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

protected_route.put('/v2/proposals/update', proposalsCtrl.updateProposal)
protected_route.put('/v2/proposals/decline', proposalsCtrl.declineProposal)
protected_route.get('/v2/proposals/:proposalId', proposalsCtrl.getProposalById)
protected_route.get('/v2/proposals/:username/:status', proposalsCtrl.getAccountProposals)

protected_route.get('/invites/:username', invites.getUserInvites)
protected_route.get('/invites/group/:researchGroupExternalId', invites.getResearchGroupPendingInvites)
protected_route.get('/invites/research/:researchExternalId', invites.getResearchPendingInvites)

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

/* V2 */
public_route.get('/v2/project/:projectId', projectsCtrl.getProject)
public_route.get('/v2/project/default/:accountId', projectsCtrl.getDefaultProject)
public_route.get('/v2/projects', projectsCtrl.getProjects)
protected_route.post('/v2/project', compose([projectCmdProxy()]), projectsCtrl.createProject)
protected_route.put('/v2/project', compose([projectCmdProxy()]), projectsCtrl.updateProject)
protected_route.put('/v2/project/delete', compose([projectCmdProxy()]), projectsCtrl.deleteProject)
public_route.get('/v2/projects/listing', projectsCtrl.getPublicProjectsListing)
public_route.get('/project/:projectId/attribute/:attributeId/file/:filename', compose([attributeFileProxy()]), projectsCtrl.getProjectAttributeFile)
protected_route.get('/v2/projects/user/listing/:username', projectsCtrl.getUserProjectsListing)
protected_route.get('/v2/projects/team/listing/:teamId', projectsCtrl.getTeamProjectsListing)
public_route.get('/v2/projects/tenant/listing', projectsCtrl.getTenantProjectsListing)

protected_route.post('/v2/team', compose([teamCmdProxy()]), teamsCtrl.createTeam)
protected_route.put('/v2/team', compose([teamCmdProxy()]), teamsCtrl.updateTeam)
public_route.get('/v2/teams/listing', teamsCtrl.getTeamsListing)
public_route.get('/v2/team/:teamId', teamsCtrl.getTeam)
public_route.get('/v2/teams/member/:username', teamsCtrl.getTeamsByUser)
public_route.get('/v2/teams/tenant/:tenantId', teamsCtrl.getTeamsByTenant)
public_route.get('/team/logo/:teamId', compose([teamLogoProxy()]), teamsCtrl.getTeamLogo)
public_route.get('/team/:teamId/attribute/:attributeId/file/:filename', compose([attributeFileProxy()]), teamsCtrl.getTeamAttributeFile)
protected_route.post('/v2/team/leave', teamsCtrl.leaveTeam)// temp: need change to cmd

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
protected_route.post('/v2/asset/create', assetsCtrl.createAsset)
protected_route.post('/v2/asset/issue', assetsCtrl.issueAsset)

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
public_route.get('/user/avatar/:username', compose([userAvatarFileReadAuth()]), usersCtrl.getAvatar)
protected_route.post('/bookmarks/user/:username', usersCtrl.addUserBookmark) //temp: need change to cmd
protected_route.delete('/bookmarks/user/:username/remove/:bookmarkId', usersCtrl.removeUserBookmark) //temp: need change to cmd

protected_route.get('/v2/bookmarks/user/:username', usersCtrl.getUserBookmarks)

public_route.get('/v2/investments/project/:projectId', invstOppCtrl.getInvstOppByProject)
protected_route.post('/v2/investments', invstOppCtrl.createInvstOpp)
protected_route.post('/v2/investments/contributions', invstOppCtrl.participateInvstOpp)
protected_route.get('/v2/investments/:tokenSaleId/contributions', invstOppCtrl.getInvstOppParticipations)
protected_route.get('/v2/investments/project/:projectId/contributions', invstOppCtrl.getInvstOppParticipationsByProject)
protected_route.get('/v2/investments/token-sale/:tokenSaleId', invstOppCtrl.getInvstOpp)
protected_route.get('/v2/investments/history/account/:account/:symbol/:step/:cursor/asset/:targetAsset', invstOppCtrl.getAccountRevenueHistoryByAsset)
protected_route.get('/v2/investments/history/account/:account/:cursor', invstOppCtrl.getAccountRevenueHistory)
protected_route.get('/v2/investments/history/contributions/account/:account', invstOppCtrl.getInvstOppParticipationsHistoryByAccount)
protected_route.get('/v2/investments/history/contributions/token-sale/:tokenSaleId', invstOppCtrl.getInvstOppParticipationsHistory)
protected_route.get('/v2/investments/history/symbol/:symbol/:cursor', invstOppCtrl.getAssetRevenueHistory)

public_route.get('/v2/document-template/:documentTemplateId', documentTemplatesCtrl.getDocumentTemplate)
public_route.get('/v2/document-templates/account/:account', documentTemplatesCtrl.getDocumentTemplatesByAccount)
protected_route.post('/v2/document-template', documentTemplatesCtrl.createDocumentTemplate)
protected_route.put('/v2/document-template', documentTemplatesCtrl.updateDocumentTemplate)
protected_route.put('/v2/document-template/delete', documentTemplatesCtrl.deleteDocumentTemplate)

public_route.get('/v2/project-content/listing', projectContentsCtrl.getPublicProjectContentListing)
public_route.get('/v2/project-content/drafts/project/:projectId', projectContentsCtrl.getDraftsByProject)
public_route.get('/v2/project-content/:projectContentId', projectContentsCtrl.getProjectContent)
public_route.get('/v2/project-content/project/:projectId', projectContentsCtrl.getProjectContentsByProject)
public_route.get('/v2/project-content/tenant/:tenantId', projectContentsCtrl.getProjectContentsByTenant)
public_route.get('/v2/project-content/draft/:draftId', projectContentsCtrl.getDraft)
public_route.get('/v2/project-content/ref/:refId', projectContentsCtrl.getProjectContentRef)
public_route.get('/v2/project-content/ref/graph/:contentId', projectContentsCtrl.getProjectContentReferencesGraph)

protected_route.post('/v2/project-content/ref/publish', compose([projectContentCmdProxy()]), projectContentsCtrl.createProjectContent)
protected_route.put('/v2/project-content/draft/unlock', compose([draftCmdProxy()]), projectContentsCtrl.unlockDraft)
protected_route.put('/v2/project-content/draft/delete', compose([draftCmdProxy()]), projectContentsCtrl.deleteDraft)
protected_route.get('/v2/project-content/texture/:projectContentId', projectContentsCtrl.getProjectContentDar)
protected_route.get('/v2/project-content/texture/:projectContentId/assets/:file', compose([projectContentCmdProxy()]), projectContentsCtrl.getProjectContentDarArchiveStaticFiles)
protected_route.put('/v2/project-content/texture', compose([draftCmdProxy()]), projectContentsCtrl.updateDraft)
protected_route.post('/v2/project-content/texture', compose([projectContentCmdProxy()]), projectContentsCtrl.createDraft)
protected_route.post('/v2/project-content/package', compose([projectContentCmdProxy()]), projectContentsCtrl.uploadProjectContentPackage)
protected_route.get('/v2/project-content/package/:projectContentId/:fileHash', compose([projectContentCmdProxy()]), projectContentsCtrl.getProjectContentPackageFile)

public_route.get('/v2/review/:reviewId', reviewsCtrl.getReview)
public_route.get('/v2/review/votes/:reviewId', reviewsCtrl.getReviewUpvotes)
public_route.get('/v2/reviews/project/:projectId', reviewsCtrl.getReviewsByProject)
public_route.get('/v2/reviews/project-content/:projectContentId', reviewsCtrl.getReviewsByProjectContent)
public_route.get('/v2/reviews/author/:author', reviewsCtrl.getReviewsByAuthor)
protected_route.post('/v2/review', reviewsCtrl.createReview)
protected_route.post('/v2/review/upvote', reviewsCtrl.upvoteReview)

protected_route.post('/v2/review-request', reviewsCtrl.createReviewRequest);
protected_route.put('/v2/review-request/deny', reviewsCtrl.denyReviewRequest);
protected_route.get('/v2/review-requests/expert/:username', reviewsCtrl.getReviewRequestsByExpert);
protected_route.get('/v2/review-requests/requestor/:username', reviewsCtrl.getReviewRequestsByRequestor);

protected_route.post('/v2/nda', projectNdaCtrl.createProjectNonDisclosureAgreement);
public_route.get('/v2/nda/:ndaId', projectNdaCtrl.getProjectNonDisclosureAgreement);
public_route.get('/v2/nda/creator/:username', projectNdaCtrl.getProjectNonDisclosureAgreementsByCreator);
public_route.get('/v2/nda/project/:projectId', projectNdaCtrl.getProjectNonDisclosureAgreementsByProject);

const routes = {
  protected: koa_router().use('/api', protected_route.routes()),
  public: koa_router().use('/api', public_route.routes())
}

module.exports = routes;