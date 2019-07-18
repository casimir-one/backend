import users from '../controllers/users'
import koa_router from 'koa-router'

const router = koa_router()

router.get('/files/avatars/:picture', users.getAvatar)

export default router