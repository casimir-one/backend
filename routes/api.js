import koa_router from 'koa-router'
import files from '../controllers/files'
import users from '../controllers/users'
import search from '../controllers/search'
import notifications from '../controllers/notifications'
import proposals from '../controllers/proposals'
import groups from '../controllers/groups'
import invites from '../controllers/invites'
import agency from '../controllers/agency'

const router = koa_router()

router.post('/files/upload-avatar', files.uploadAvatar)

router.get('/user/profile/:username', users.getUserProfile)
router.get('/user/profiles', users.getUsersProfiles)
router.post('/user/profile/:username', users.createUserProfile)
router.put('/user/profile/:username', users.updateUserProfile)

router.get('/search/contents/all', search.getAllResearchContents)

router.get('/notifications/user/:username', notifications.getNotificationsByUser)
router.put('/notifications/:username/mark-read/:notificationId', notifications.markUserNotificationAsRead)
router.put('/notifications/:username/mark-all-read', notifications.markAllUserNotificationAsRead)

router.post('/proposals/research', proposals.createResearchProposal)
router.post('/proposals/content/:type', proposals.createContentProposal)
router.post('/proposals/invite', proposals.createInviteProposal)

router.post('/groups', groups.createResearchGroup)

router.post('/invites/approve', invites.approveInvite)
router.post('/invites/reject', invites.rejectInvite)

router.get('/agencies/profile/:agency', agency.getAgencyProfile)
router.get('/agencies/profiles', agency.getAgenciesProfiles)

export default router