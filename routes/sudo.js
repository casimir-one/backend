import sudo from '../controllers/sudo'
import koa_router from 'koa-router'
const router = koa_router()

router.post('/verification-token', sudo.postVerificationToken)

export default router