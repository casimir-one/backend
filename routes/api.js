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

const router = koa_router()

router.post('/user/upload-avatar', users.uploadAvatar)
router.get('/user/profile/:username', users.getUserProfile)
router.get('/user/profiles', users.getUsersProfiles)
router.post('/user/profile/:username', users.createUserProfile)
router.put('/user/account/:username', users.updateUserAccount)
router.put('/user/profile/:username', users.updateUserProfile)
router.get('/user/avatar/:username', users.getAvatar);

router.get('/bookmarks/user/:username', users.getUserBookmarks)
router.post('/bookmarks/user/:username', users.addUserBookmark)
router.delete('/bookmarks/user/:username/remove/:bookmarkId', users.removeUserBookmark)

router.post('/join-requests', joinRequests.createJoinRequest)
router.put('/join-requests', joinRequests.updateJoinRequest)
router.get('/join-requests/group/:groupId', joinRequests.getJoinRequestsByGroup)
router.get('/join-requests/user/:username', joinRequests.getJoinRequestsByUser)

router.post('/review-requests', reviewRequests.createReviewRequest);
router.post('/review-requests/:id/deny', reviewRequests.denyReviewRequest);
router.get('/review-requests/expert/:username', reviewRequests.getReviewRequestsByExpert);
router.get('/review-requests/requestor/:username', reviewRequests.getReviewRequestsByRequestor);

router.post('/expertise-claims', expertiseClaims.createExpertiseClaim)
router.post('/expertise-claims/vote', expertiseClaims.voteForExpertiseClaim)
router.get('/expertise-claims', expertiseClaims.getExpertiseClaims)
router.get('/expertise-claims/user/:username', expertiseClaims.getExpertiseClaimsByUser)
router.get('/expertise-claims/discipline/:disciplineId', expertiseClaims.getExpertiseClaimsByDiscipline)
router.get('/expertise-claims/user/:username/discipline/:disciplineId', expertiseClaims.getExpertiseClaimsByUserAndDiscipline)

router.get('/search/contents/all', search.getAllResearchContents)

router.get('/notifications/user/:username', notifications.getNotificationsByUser)
router.put('/notifications/:username/mark-read/:notificationId', notifications.markUserNotificationAsRead)
router.put('/notifications/:username/mark-all-read', notifications.markAllUserNotificationAsRead)

router.post('/proposals', proposals.createProposal)
router.put('/proposals', proposals.updateProposal)
router.delete('/proposals', proposals.deleteProposal)
router.post('/proposals/vote', proposals.voteForProposal)
router.post('/proposals/invite', proposals.createInviteProposal)
router.post('/proposals/exclude', proposals.createExcludeProposal)
router.post('/proposals/token-sale', proposals.createTokenSaleProposal)

router.post('/groups', researchGroups.createResearchGroup)
router.put('/groups', researchGroups.updateResearchGroup)
router.get('/groups/activity-log/:researchGroupId', researchGroups.getResearchGroupActivityLogs)
router.get('/groups/logo/:researchGroupId', researchGroups.getLogo)
router.post('/groups/logo', researchGroups.uploadLogo)
router.post('/groups/invite', researchGroups.inviteToResearchGroup)
router.post('/groups/left', researchGroups.leftResearchGroup)

router.post('/invites/approve', invites.approveInvite)
router.post('/invites/reject', invites.rejectInvite)

router.post('/reviews', reviews.makeReview)

router.post('/research', research.createResearch)
router.put('/research', research.updateResearch)
router.put('/research/meta/:researchExternalId', research.updateResearchMeta)
router.get('/research/:researchId', research.getResearch)
router.get('/research/background/:researchExternalId', research.getBackground)
router.post('/research/background', research.uploadBackground)
router.post('/research/token-sale', research.createResearchTokenSale)
router.post('/research/token-sale/contribution', research.createResearchTokenSaleContribution)

router.get('/investment-portfolio/:username', investmentPortfolio.getUserInvestmentPortfolio)
router.put('/investment-portfolio/:username', investmentPortfolio.updateInvestmentPortfolio)

router.get('/award-withdrawal-requests/:awardNumber/:paymentNumber', grants.getAwardWithdrawalRequestRefByHash)
router.get('/award-withdrawal-requests/:awardNumber/:paymentNumber/:fileHash', grants.getAwardWithdrawalRequestAttachmentFile)
router.post('/award-withdrawal-requests/upload-attachments', grants.uploadAwardWithdrawalRequestBulkAttachments)

export default router