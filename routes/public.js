import users from '../controllers/users'
import agency from '../controllers/agency'
import koa_router from 'koa-router'


const router = koa_router()

router.get('/files/avatars/:picture', users.getAvatar)
router.get('/agencies/logo/:agency', agency.getAgencyLogo)

export default router