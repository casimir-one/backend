import koa_router from 'koa-router'
import files from '../controllers/files'
import users from '../controllers/users'
import joinRequests from '../controllers/joinRequests'
import expertiseClaims from '../controllers/expertiseClaims'
import search from '../controllers/search'
import notifications from '../controllers/notifications'
import proposals from '../controllers/proposals'
import groups from '../controllers/groups'


const router = koa_router()

router.post('/files/upload-avatar', files.uploadAvatar)

router.get('/user/profile/:username', users.getUserProfile)
router.get('/user/profiles', users.getUsersProfiles)
router.post('/user/profile/:username', users.createUserProfile)
router.put('/user/profile/:username', users.updateUserProfile)

router.post('/join-requests', joinRequests.createJoinRequest)
router.put('/join-requests', joinRequests.updateJoinRequest)
router.get('/join-requests/group/:groupId', joinRequests.getJoinRequestsByGroup)
router.get('/join-requests/user/:username', joinRequests.getJoinRequestsByUser)

router.post('/expertise-claims', expertiseClaims.createExpertiseClaim)
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

export default router