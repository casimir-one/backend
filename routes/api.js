import koa_router from 'koa-router'
import files from '../controllers/files'
import users from '../controllers/users'
import joinRequests from '../controllers/joinRequests'


const router = koa_router()

router.post('/files/upload-content', files.uploadContent)
router.post('/files/upload-avatar', files.uploadAvatar)

router.get('/user/profile/:username', users.getUserProfile)
router.get('/user/profiles', users.getUsersProfiles)
router.post('/user/profile/:username', users.createUserProfile)
router.put('/user/profile/:username', users.updateUserProfile)

router.post('/join-requests', joinRequests.createJoinRequest)
router.put('/join-requests', joinRequests.updateJoinRequest)
router.get('/join-requests/group/:groupId', joinRequests.getJoinRequestsByGroup)
router.get('/join-requests/user/:username', joinRequests.getJoinRequestsByUser)


export default router