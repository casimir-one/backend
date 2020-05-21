import koa_router from 'koa-router'
import users from '../controllers/users'
import joinRequests from '../controllers/joinRequests'
import reviewRequests from '../controllers/reviewRequests'
import expertiseClaims from '../controllers/expertiseClaims'
import search from '../controllers/search'
import notifications from '../controllers/notifications'
import proposals from '../controllers/proposals'
import researchGroups from '../controllers/researchGroups'
import invites from '../controllers/invites'
import reviews from '../controllers/reviews'
import research from '../controllers/research'
import investmentPortfolio from '../controllers/investmentPortfolio'
import grants from '../controllers/grants'

const protected_route = koa_router()
const public_route = koa_router()

protected_route.post('/user/upload-avatar', users.uploadAvatar)
public_route.get('/user/profile/:username', users.getUserProfile)
public_route.get('/user/profiles', users.getUsersProfiles)
public_route.get('/user/active', users.getActiveUsersProfiles)

protected_route.put('/user/account/:username', users.updateUserAccount)
protected_route.put('/user/profile/:username', users.updateUserProfile)
public_route.get('/user/avatar/:username', users.getAvatar);

protected_route.get('/bookmarks/user/:username', users.getUserBookmarks)
protected_route.post('/bookmarks/user/:username', users.addUserBookmark)
protected_route.delete('/bookmarks/user/:username/remove/:bookmarkId', users.removeUserBookmark)

protected_route.post('/join-requests', joinRequests.createJoinRequest)
protected_route.put('/join-requests', joinRequests.updateJoinRequest)
protected_route.get('/join-requests/group/:groupId', joinRequests.getJoinRequestsByGroup)
protected_route.get('/join-requests/user/:username', joinRequests.getJoinRequestsByUser)

protected_route.post('/review-requests', reviewRequests.createReviewRequest);
protected_route.post('/review-requests/:id/deny', reviewRequests.denyReviewRequest);
protected_route.get('/review-requests/expert/:username', reviewRequests.getReviewRequestsByExpert);
protected_route.get('/review-requests/requestor/:username', reviewRequests.getReviewRequestsByRequestor);

protected_route.post('/expertise-claims', expertiseClaims.createExpertiseClaim)
protected_route.post('/expertise-claims/vote', expertiseClaims.voteForExpertiseClaim)
protected_route.get('/expertise-claims', expertiseClaims.getExpertiseClaims)
protected_route.get('/expertise-claims/user/:username', expertiseClaims.getExpertiseClaimsByUser)
protected_route.get('/expertise-claims/discipline/:disciplineId', expertiseClaims.getExpertiseClaimsByDiscipline)
protected_route.get('/expertise-claims/user/:username/discipline/:disciplineId', expertiseClaims.getExpertiseClaimsByUserAndDiscipline)

public_route.get('/search/contents/all', search.getAllResearchContents)

protected_route.get('/notifications/user/:username', notifications.getNotificationsByUser)
protected_route.put('/notifications/:username/mark-read/:notificationId', notifications.markUserNotificationAsRead)
protected_route.put('/notifications/:username/mark-all-read', notifications.markAllUserNotificationAsRead)

protected_route.post('/proposals', proposals.createProposal)
protected_route.put('/proposals', proposals.updateProposal)
protected_route.put('/proposals/delete', proposals.deleteProposal)

protected_route.post('/groups', researchGroups.createResearchGroup)
protected_route.put('/groups', researchGroups.updateResearchGroup)
protected_route.get('/groups/activity-log/:researchGroupExternalId', researchGroups.getResearchGroupActivityLogs)
public_route.get('/groups/logo/:researchGroupExternalId', researchGroups.getResearchGroupLogo)
protected_route.post('/groups/logo', researchGroups.uploadResearchGroupLogo)
protected_route.post('/groups/left', researchGroups.excludeFromResearchGroup)

protected_route.get('/invites/:username', invites.getUserInvites)
protected_route.get('/invites/group/:researchGroupExternalId', invites.getResearchGroupPendingInvites)
protected_route.post('/invites', invites.createUserInvite)
protected_route.post('/invites/approve', invites.approveUserInvite)
protected_route.post('/invites/reject', invites.rejectUserInvite)


protected_route.post('/reviews', reviews.makeReview)

protected_route.post('/research', research.createResearch)
protected_route.put('/research', research.updateResearch)
protected_route.put('/research/meta/:researchExternalId', research.updateResearchMeta)
public_route.get('/research/:researchExternalId', research.getResearchProfile)
public_route.get('/research/background/:researchExternalId', research.getResearchBackground)
protected_route.post('/research/background', research.uploadResearchBackground)
protected_route.post('/research/token-sale', research.createResearchTokenSale)
protected_route.post('/research/token-sale/contribution', research.createResearchTokenSaleContribution)
protected_route.post('/research/application', research.createResearchApplication)
protected_route.get('/research/application/list', research.getResearchApplications)
protected_route.post('/research/application/approve', research.approveResearchApplication)
protected_route.post('/research/application/reject', research.rejectResearchApplication)

protected_route.get('/investment-portfolio/:username', investmentPortfolio.getUserInvestmentPortfolio)
protected_route.put('/investment-portfolio/:username', investmentPortfolio.updateInvestmentPortfolio)

protected_route.get('/award-withdrawal-requests/:awardNumber/:paymentNumber', grants.getAwardWithdrawalRequestRefByHash)
protected_route.get('/award-withdrawal-requests/:awardNumber/:paymentNumber/:fileHash', grants.getAwardWithdrawalRequestAttachmentFile)
protected_route.post('/award-withdrawal-requests/upload-attachments', grants.uploadAwardWithdrawalRequestBulkAttachments)


const routes = {
  protected: koa_router().use('/api', protected_route.routes()),
  public: koa_router().use('/api', public_route.routes())
}

module.exports = routes;