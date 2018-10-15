import koa_router from 'koa-router'
import files from '../controllers/files'
import users from '../controllers/users'
import joinRequests from '../controllers/joinRequests'
import expertiseClaims from '../controllers/expertiseClaims'


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
router.get('/expertise-claims/user/:username', expertiseClaims.getExpertiseClaimsByUser)
router.get('/expertise-claims/discipline/:disciplineId', expertiseClaims.getExpertiseClaimsByDiscipline)
router.get('/expertise-claims/user/:username/discipline/:disciplineId', expertiseClaims.getExpertiseClaimsByUserAndDiscipline)

export default router