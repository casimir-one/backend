import koa_router from 'koa-router'
import files from '../controllers/files'
import users from '../controllers/users'
import joinRequests from '../controllers/joinRequests'
import reviewRequests from '../controllers/reviewRequests'
import expertiseClaims from '../controllers/expertiseClaims'
import search from '../controllers/search'
import notifications from '../controllers/notifications'
import proposals from '../controllers/proposals'
import groups from '../controllers/groups'
import invites from '../controllers/invites'
import reviews from '../controllers/reviews'
import agency from '../controllers/agency'
import investmentPortfolio from '../controllers/investmentPortfolio'

const router = koa_router()

router.post('/files/upload-avatar', files.uploadAvatar)

router.get('/user/profile/:username', users.getUserProfile)
router.get('/user/profiles', users.getUsersProfiles)
router.post('/user/profile/:username', users.createUserProfile)
router.put('/user/profile/:username', users.updateUserProfile)

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

router.post('/proposals/vote', proposals.voteForProposal)
router.post('/proposals/research', proposals.createResearchProposal)
router.post('/proposals/content/:type', proposals.createContentProposal)
router.post('/proposals/invite', proposals.createInviteProposal)
router.post('/proposals/token-sale', proposals.createTokenSaleProposal)

router.post('/groups', groups.createResearchGroup)

router.post('/invites/approve', invites.approveInvite)
router.post('/invites/reject', invites.rejectInvite)

router.post('/reviews', reviews.makeReview)

router.get('/agencies/profile/:agency', agency.getAgencyProfile)
router.get('/agencies/profiles', agency.getAgenciesProfiles)

router.get('/investment-portfolio/:username', investmentPortfolio.getUserInvestmentPortfolio)
router.put('/investment-portfolio/:username', investmentPortfolio.updateInvestmentPortfolio)

export default router