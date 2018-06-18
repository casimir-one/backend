import koa_router from 'koa-router'
import files from '../controllers/files'
import users from '../controllers/users'

const router = koa_router()

router.post('/files/upload-content', files.uploadContent)
router.post('/files/upload-avatar', files.uploadAvatar)

router.get('/user/profile/:username', users.getUserProfile)
router.post('/user/profile/:username', users.createUserProfile)
router.put('/user/profile/:username', users.updateUserProfile)


export default router