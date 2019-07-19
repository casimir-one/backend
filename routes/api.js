import koa_router from 'koa-router'
import users from '../controllers/users'
import notifications from '../controllers/notifications'
import proposals from '../controllers/proposals'
import groups from '../controllers/groups'
import invites from '../controllers/invites'
import files from '../controllers/files'

const router = koa_router()

router.post('/files/upload-avatar', users.uploadAvatar)

router.get('/user/profile/:username', users.getUserProfile)
router.get('/user/profiles', users.getUsersProfiles)
router.post('/user/profile/:username', users.createUserProfile)
router.put('/user/profile/:username', users.updateUserProfile)

router.get('/notifications/user/:username', notifications.getNotificationsByUser)
router.put('/notifications/:username/mark-read/:notificationId', notifications.markUserNotificationAsRead)
router.put('/notifications/:username/mark-all-read', notifications.markAllUserNotificationAsRead)

router.post('/proposals/research', proposals.createResearchProposal)
router.post('/proposals/invite', proposals.createInviteProposal)

router.post('/groups', groups.createResearchGroup)
router.get('/groups/profile/:permlink', groups.getGroupProfile)
router.put('/groups/profile/:permlink', groups.updateGroupProfile)

router.post('/invites/approve', invites.approveInvite)
router.post('/invites/reject', invites.rejectInvite)

router.get('/refs/project/:projectId', files.listFileRefs)
router.get('/refs/project/file-id/:refId', files.getFileRefById)
router.get('/refs/project/:projectId/file-hash/:hash', files.getFileRefByHash)
router.get('/refs/certificate/:projectId/file-hash/:hash', files.getCertificate)


export default router